import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { CATEGORIA_POR_SLUG, PIEZAS_PAPELERIA } from '../../../core/data/categorias-papeleria';
import { CabeceraSeccion } from '../../../shared/cabecera-seccion/cabecera-seccion';
import { DatosEnviados, FormularioSolicitud } from '../../../shared/formulario-solicitud/formulario-solicitud';
import { EnvioCorrecto } from '../../../shared/envio-correcto/envio-correcto';
import { PublicoService } from '../../../core/data/publico.service';
import { ReservasService, SolicitudesService } from '../../../core/data/solicitudes.service';
import { SeoService } from '../../../core/seo/seo.service';
import { TipoFormulario, TipoSolicitud } from '../../../core/models';

interface Definicion {
  formulario: TipoFormulario;
  antetitulo: string;
  titulo: string;
  entradilla: string;
  boton: string;
  confirmacion: string;
}

const DEFINICIONES: Record<string, Definicion> = {
  papeleria: {
    formulario: 'papeleria',
    antetitulo: 'Bodas',
    titulo: 'Presupuesto de papelería',
    entradilla:
      'Cuéntanos qué necesitáis y os preparamos un presupuesto cerrado, sin compromiso.',
    boton: 'Pedir presupuesto',
    confirmacion: 'Hemos recibido vuestra petición. Os escribimos con un presupuesto a medida.',
  },
  'live-art': {
    formulario: 'liveart',
    antetitulo: 'Live art',
    titulo: 'Acuarelas en directo',
    entradilla: 'Dinos la fecha, el sitio y cuántos invitados sois, y te contamos disponibilidad.',
    boton: 'Consultar disponibilidad',
    confirmacion: 'Hemos recibido tu consulta. Te decimos disponibilidad y precio en breve.',
  },
  encargo: {
    formulario: 'encargo',
    antetitulo: 'Encargos',
    titulo: 'Acuarela por encargo',
    entradilla: 'Cuéntanos qué tienes en mente y te decimos plazos y precio.',
    boton: 'Pedir presupuesto',
    confirmacion: 'Hemos recibido tu encargo. Te escribimos con plazos y precio.',
  },
  contacto: {
    formulario: 'contacto',
    antetitulo: 'Hablemos',
    titulo: 'Escríbenos',
    entradilla: 'Cualquier duda, propuesta o consulta. Te respondemos por correo.',
    boton: 'Enviar mensaje',
    confirmacion: 'Hemos recibido tu mensaje. Te respondemos lo antes posible.',
  },
  bono: {
    formulario: 'bono',
    antetitulo: 'Talleres',
    titulo: 'Solicitar un bono mensual',
    entradilla: 'Elige el bono que te interesa y te contamos cómo empezar.',
    boton: 'Solicitar bono',
    confirmacion: 'Hemos recibido tu solicitud. Te escribimos para organizar los días.',
  },
};

@Component({
  selector: 'veta-solicitar',
  imports: [RouterLink, CabeceraSeccion, FormularioSolicitud, EnvioCorrecto],
  templateUrl: './solicitar.html',
  styleUrl: './solicitar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Solicitar {
  // El tipo lo fija la propia ruta con `data`.
  readonly tipo = input.required<string>();
  // Solo en la solicitud de bono: llega como parámetro opcional de consulta.
  readonly bono = input<string | undefined>();
  // Solo en papelería: el slug de la subsección desde la que se pulsó el CTA.
  readonly sobre = input<string | undefined>();

  private readonly solicitudes = inject(SolicitudesService);
  private readonly reservas = inject(ReservasService);
  private readonly publico = inject(PublicoService);
  private readonly seo = inject(SeoService);

  protected readonly bonos = toSignal(this.publico.bonosActivos(), { initialValue: [] });

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly error = signal('');
  protected readonly bonoElegido = signal('');

  protected readonly definicion = computed(() => DEFINICIONES[this.tipo()] ?? DEFINICIONES['contacto']);
  protected readonly esBono = computed(() => this.tipo() === 'bono');
  protected readonly esPapeleria = computed(() => this.definicion().formulario === 'papeleria');

  protected readonly opcionesPiezas = computed(() => (this.esPapeleria() ? PIEZAS_PAPELERIA : []));

  // El slug viene de la URL, así que puede ser cualquier cosa: si no cuadra con
  // una categoría real, no se premarca nada y la clienta elige.
  protected readonly piezasIniciales = computed(() => {
    const slug = this.sobre();
    const categoria = slug ? CATEGORIA_POR_SLUG[slug] : undefined;

    return this.esPapeleria() && categoria ? [categoria] : [];
  });

  constructor() {
    effect(() => {
      const inicial = this.bono();
      if (inicial && !this.bonoElegido()) this.bonoElegido.set(inicial);
    });

    effect(() => {
      const def = this.definicion();

      this.seo.aplicar({
        titulo: `${def.titulo} · Veta Estudio Creativo`,
        descripcion: def.entradilla,
        ruta: `/solicitar/${this.tipo()}`,
        noIndex: true,
      });
      this.seo.datosEstructurados(null);
    });
  }

  protected async enviar(datos: DatosEnviados): Promise<void> {
    if (this.enviando()) return;

    if (this.esBono() && !this.bonoElegido()) {
      this.error.set('Elige qué bono te interesa.');
      return;
    }

    this.enviando.set(true);
    this.error.set('');

    try {
      // El bono es una reserva sin sesión; el resto son solicitudes de presupuesto.
      if (this.esBono()) {
        await this.reservas.enviar({
          tipo: 'bono',
          sessionId: null,
          bonoId: this.bonoElegido(),
          nombre: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          nPersonas: 1,
          respuestas: datos.respuestas,
        });
      } else {
        await this.solicitudes.enviar({
          tipo: this.definicion().formulario as TipoSolicitud,
          piezas: this.esPapeleria() ? datos.piezas : [],
          nombre: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          respuestas: datos.respuestas,
        });
      }

      this.enviado.set(true);
    } catch {
      this.error.set(
        'No hemos podido enviar el formulario. Vuelve a intentarlo o escríbenos directamente.',
      );
    } finally {
      this.enviando.set(false);
    }
  }
}
