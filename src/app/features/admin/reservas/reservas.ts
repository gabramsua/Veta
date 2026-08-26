import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';

import { AlertasService } from '../../../core/ui/alertas.service';
import { BonosService, SesionesService, TalleresService } from '../../../core/data/contenido.services';
import { EstadoReserva, Reserva } from '../../../core/models';
import { EstadoVacio } from '../../../shared/estado-vacio/estado-vacio';
import { PanelSeccion } from '../../../shared/panel-seccion/panel-seccion';
import { ReservasService } from '../../../core/data/solicitudes.service';
import { Respuestas } from '../../../shared/respuestas/respuestas';
import { formatearFecha } from '../../../core/data/fechas';

const PASO = 25;

@Component({
  selector: 'veta-reservas',
  imports: [PanelSeccion, EstadoVacio, Respuestas],
  templateUrl: './reservas.html',
  styleUrl: './reservas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reservas {
  private readonly servicio = inject(ReservasService);
  private readonly sesiones = inject(SesionesService);
  private readonly talleres = inject(TalleresService);
  private readonly bonos = inject(BonosService);
  private readonly alertas = inject(AlertasService);

  protected readonly formatearFecha = formatearFecha;

  protected readonly limite = signal(PASO);
  protected readonly filtroEstado = signal<'' | EstadoReserva>('');
  protected readonly filtroTipo = signal<'' | 'taller' | 'bono'>('');
  protected readonly busqueda = signal('');
  protected readonly abierta = signal<string | null>(null);
  protected readonly procesando = signal<string | null>(null);

  // La consulta se rehace al pedir más: `limit` en servidor, no en memoria.
  protected readonly lista = toSignal(
    toObservable(this.limite).pipe(
      switchMap((cuantas) => this.servicio.listarRecientes(cuantas).pipe(catchError(() => of([])))),
    ),
    { initialValue: [] },
  );

  private readonly listaSesiones = toSignal(
    this.sesiones.listarPorFecha().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  private readonly listaTalleres = toSignal(
    this.talleres.listarOrdenados().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  private readonly listaBonos = toSignal(
    this.bonos.listarOrdenados().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly filtradas = computed(() => {
    const estado = this.filtroEstado();
    const tipo = this.filtroTipo();
    const texto = this.busqueda().trim().toLowerCase();

    return this.lista().filter(
      (r) =>
        (!estado || r.status === estado) &&
        (!tipo || r.tipo === tipo) &&
        (!texto ||
          r.nombre.toLowerCase().includes(texto) ||
          r.email.toLowerCase().includes(texto) ||
          r.telefono.includes(texto)),
    );
  });

  protected readonly pendientes = computed(
    () => this.lista().filter((r) => r.status === 'pendiente').length,
  );

  protected readonly hayMas = computed(() => this.lista().length >= this.limite());

  protected queEs(reserva: Reserva): string {
    if (reserva.tipo === 'bono') {
      return this.listaBonos().find((b) => b.id === reserva.bonoId)?.titulo ?? 'Bono borrado';
    }

    const sesion = this.listaSesiones().find((s) => s.id === reserva.sessionId);
    if (!sesion) return 'Sesión borrada';

    const taller = this.listaTalleres().find((t) => t.id === sesion.workshopId);
    return taller?.titulo ?? 'Taller borrado';
  }

  protected cuando(reserva: Reserva): string {
    if (reserva.tipo === 'bono') return 'Bono mensual · sin fecha fija';

    const sesion = this.listaSesiones().find((s) => s.id === reserva.sessionId);
    return sesion ? formatearFecha(sesion.fechaInicio) : '—';
  }

  protected etiquetaEstado(estado: EstadoReserva): string {
    return { pendiente: 'Pendiente', confirmada: 'Confirmada', cancelada: 'Cancelada' }[estado];
  }

  protected alternar(id: string): void {
    this.abierta.update((actual) => (actual === id ? null : id));
  }

  protected cargarMas(): void {
    this.limite.update((n) => n + PASO);
  }

  protected async confirmar(reserva: Reserva): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      `¿Confirmar la reserva de ${reserva.nombre}?`,
      `Se descontarán ${reserva.nPersonas} plaza(s) y se le enviará un correo con las instrucciones de pago.`,
      'Sí, confirmar',
    );

    if (!confirmado) return;

    await this.cambiarEstado(reserva, 'confirmada');
  }

  protected async cancelar(reserva: Reserva): Promise<void> {
    const devuelve = reserva.status === 'confirmada';

    const confirmado = await this.alertas.confirmar(
      `¿Cancelar la reserva de ${reserva.nombre}?`,
      devuelve
        ? `Se devolverán ${reserva.nPersonas} plaza(s) al cupo y se le avisará por correo.`
        : 'Se le avisará por correo. Esta reserva no tenía plazas descontadas.',
      'Sí, cancelar',
    );

    if (!confirmado) return;

    await this.cambiarEstado(reserva, 'cancelada');
  }

  private async cambiarEstado(reserva: Reserva, status: 'confirmada' | 'cancelada'): Promise<void> {
    this.procesando.set(reserva.id);

    try {
      await this.servicio.cambiarEstado(reserva.id, status);
      await this.alertas.aviso(status === 'confirmada' ? 'Reserva confirmada' : 'Reserva cancelada');
    } catch (e) {
      // La Function devuelve el motivo real: sin plazas, sesión borrada, etc.
      const mensaje =
        typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Inténtalo de nuevo.';

      await this.alertas.error('No hemos podido cambiar el estado', mensaje);
    } finally {
      this.procesando.set(null);
    }
  }

  protected async guardarNotas(reserva: Reserva, evento: Event): Promise<void> {
    const notasInternas = (evento.target as HTMLTextAreaElement).value.trim();
    if (notasInternas === reserva.notasInternas) return;

    await this.servicio.actualizar(reserva.id, { notasInternas });
    await this.alertas.aviso('Nota guardada');
  }

  protected async borrar(reserva: Reserva): Promise<void> {
    if (reserva.status === 'confirmada') {
      await this.alertas.error(
        'Cancélala antes de borrarla',
        'Esta reserva tiene plazas descontadas. Si la borras directamente, esas plazas se quedan ocupadas para siempre.',
      );
      return;
    }

    const confirmado = await this.alertas.confirmar(
      `¿Borrar la reserva de ${reserva.nombre}?`,
      'Se pierde el registro y los datos de contacto. No se puede deshacer.',
      'Sí, borrar',
    );

    if (!confirmado) return;

    await this.servicio.borrar(reserva.id);
    await this.alertas.aviso('Reserva borrada');
  }
}
