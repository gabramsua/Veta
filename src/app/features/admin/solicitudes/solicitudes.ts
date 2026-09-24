import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';

import { AlertasService } from '../../../core/ui/alertas.service';
import { EstadoSolicitud, Solicitud, TipoSolicitud } from '../../../core/models';
import { ETIQUETA_POR_PIEZA } from '../../../core/data/categorias-papeleria';
import { EstadoVacio } from '../../../shared/estado-vacio/estado-vacio';
import { PanelSeccion } from '../../../shared/panel-seccion/panel-seccion';
import { Respuestas } from '../../../shared/respuestas/respuestas';
import { SolicitudesService } from '../../../core/data/solicitudes.service';
import { formatearFecha } from '../../../core/data/fechas';

const PASO = 25;

const ESTADOS: { valor: EstadoSolicitud; etiqueta: string; ayuda: string }[] = [
  { valor: 'nueva', etiqueta: 'Nueva', ayuda: 'Sin abrir todavía.' },
  { valor: 'en-curso', etiqueta: 'En curso', ayuda: 'Preparando el presupuesto.' },
  { valor: 'respondida', etiqueta: 'Respondida', ayuda: 'Presupuesto enviado, esperando respuesta.' },
  { valor: 'cerrada', etiqueta: 'Cerrada', ayuda: 'Terminada, con o sin encargo.' },
];

const TIPOS: Record<TipoSolicitud, string> = {
  papeleria: 'Papelería de bodas',
  liveart: 'Live art',
  encargo: 'Acuarelas y encargos',
  evento: 'Taller privado',
  contacto: 'Contacto general',
};

@Component({
  selector: 'veta-solicitudes',
  imports: [PanelSeccion, EstadoVacio, Respuestas],
  templateUrl: './solicitudes.html',
  styleUrl: './solicitudes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Solicitudes {
  private readonly servicio = inject(SolicitudesService);
  private readonly alertas = inject(AlertasService);

  protected readonly formatearFecha = formatearFecha;
  protected readonly estados = ESTADOS;
  protected readonly tipos = Object.entries(TIPOS) as [TipoSolicitud, string][];

  protected readonly limite = signal(PASO);
  protected readonly filtroEstado = signal<'' | EstadoSolicitud>('');
  protected readonly filtroTipo = signal<'' | TipoSolicitud>('');
  protected readonly busqueda = signal('');
  protected readonly abierta = signal<string | null>(null);

  protected readonly lista = toSignal(
    toObservable(this.limite).pipe(
      switchMap((cuantas) => this.servicio.listarRecientes(cuantas).pipe(catchError(() => of([])))),
    ),
    { initialValue: [] },
  );

  protected readonly filtradas = computed(() => {
    const estado = this.filtroEstado();
    const tipo = this.filtroTipo();
    const texto = this.busqueda().trim().toLowerCase();

    return this.lista().filter(
      (s) =>
        (!estado || s.status === estado) &&
        (!tipo || s.tipo === tipo) &&
        (!texto ||
          s.nombre.toLowerCase().includes(texto) ||
          s.email.toLowerCase().includes(texto) ||
          s.telefono.includes(texto)),
    );
  });

  protected readonly sinResponder = computed(
    () => this.lista().filter((s) => s.status === 'nueva').length,
  );

  protected readonly hayMas = computed(() => this.lista().length >= this.limite());

  // Las piezas se guardan por su clave para poder filtrar por ellas más
  // adelante; aquí se traducen al nombre que Carmen reconoce.
  protected nombresPiezas(piezas: string[] | undefined): string {
    return (piezas ?? []).map((pieza) => ETIQUETA_POR_PIEZA[pieza] ?? pieza).join(' · ');
  }

  protected nombreTipo(tipo: TipoSolicitud): string {
    return TIPOS[tipo] ?? tipo;
  }

  protected etiquetaEstado(estado: EstadoSolicitud): string {
    return ESTADOS.find((e) => e.valor === estado)?.etiqueta ?? estado;
  }

  // Abrir una solicitud nueva la pasa a «en curso»: si la has leído, ya no es nueva.
  protected async alternar(solicitud: Solicitud): Promise<void> {
    const abriendo = this.abierta() !== solicitud.id;
    this.abierta.set(abriendo ? solicitud.id : null);

    if (abriendo && solicitud.status === 'nueva') {
      await this.servicio.actualizar(solicitud.id, { status: 'en-curso' });
    }
  }

  protected async cambiarEstado(solicitud: Solicitud, evento: Event): Promise<void> {
    const status = (evento.target as HTMLSelectElement).value as EstadoSolicitud;
    if (status === solicitud.status) return;

    await this.servicio.actualizar(solicitud.id, { status });
    await this.alertas.aviso('Estado actualizado');
  }

  protected async guardarNotas(solicitud: Solicitud, evento: Event): Promise<void> {
    const notasInternas = (evento.target as HTMLTextAreaElement).value.trim();
    if (notasInternas === solicitud.notasInternas) return;

    await this.servicio.actualizar(solicitud.id, { notasInternas });
    await this.alertas.aviso('Nota guardada');
  }

  protected asunto(solicitud: Solicitud): string {
    return encodeURIComponent(`Tu solicitud de ${this.nombreTipo(solicitud.tipo).toLowerCase()} · Veta`);
  }

  protected cargarMas(): void {
    this.limite.update((n) => n + PASO);
  }

  protected async borrar(solicitud: Solicitud): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      `¿Borrar la solicitud de ${solicitud.nombre}?`,
      'Se pierden sus datos de contacto y lo que os contó. No se puede deshacer.',
      'Sí, borrar',
    );

    if (!confirmado) return;

    await this.servicio.borrar(solicitud.id);
    await this.alertas.aviso('Solicitud borrada');
  }
}
