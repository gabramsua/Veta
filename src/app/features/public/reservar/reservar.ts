import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { CabeceraSeccion } from '../../../shared/cabecera-seccion/cabecera-seccion';
import { DatosEnviados, FormularioSolicitud } from '../../../shared/formulario-solicitud/formulario-solicitud';
import { EnvioCorrecto } from '../../../shared/envio-correcto/envio-correcto';
import { PublicoService } from '../../../core/data/publico.service';
import { ReservasService } from '../../../core/data/solicitudes.service';
import { SeoService } from '../../../core/seo/seo.service';
import { formatearFecha } from '../../../core/data/fechas';

@Component({
  selector: 'veta-reservar',
  imports: [RouterLink, CabeceraSeccion, FormularioSolicitud, EnvioCorrecto],
  templateUrl: './reservar.html',
  styleUrl: './reservar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reservar {
  // Llega del parámetro :sesion de la ruta.
  readonly sesion = input.required<string>();

  private readonly publico = inject(PublicoService);
  private readonly reservas = inject(ReservasService);
  private readonly seo = inject(SeoService);

  protected readonly formatearFecha = formatearFecha;

  private readonly disponibles = toSignal(this.publico.proximasSesiones(), { initialValue: [] });

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly error = signal('');

  protected readonly elegida = computed(() =>
    this.disponibles().find((s) => s.sesion.id === this.sesion()) ?? null,
  );

  protected readonly plazasLibres = computed(() => this.elegida()?.plazasLibres ?? 0);

  constructor() {
    effect(() => {
      const item = this.elegida();

      this.seo.aplicar({
        titulo: item ? `Reservar ${item.taller.titulo} · Veta` : 'Reservar plaza · Veta',
        descripcion: 'Solicita tu plaza en un taller de Veta Estudio Creativo, Sevilla.',
        ruta: `/reservar/${this.sesion()}`,
        noIndex: true,
      });
      this.seo.datosEstructurados(null);
    });
  }

  protected async enviar(datos: DatosEnviados): Promise<void> {
    const item = this.elegida();
    if (!item || this.enviando()) return;

    if (datos.nPersonas > item.plazasLibres) {
      this.error.set(
        `Solo quedan ${item.plazasLibres} plaza(s) libre(s) en esta sesión. Ajusta el número de personas.`,
      );
      return;
    }

    this.enviando.set(true);
    this.error.set('');

    try {
      await this.reservas.enviar({
        tipo: 'taller',
        sessionId: item.sesion.id,
        bonoId: null,
        nombre: datos.nombre,
        email: datos.email,
        telefono: datos.telefono,
        nPersonas: datos.nPersonas,
        respuestas: datos.respuestas,
      });

      this.enviado.set(true);
    } catch {
      this.error.set(
        'No hemos podido enviar tu solicitud. Vuelve a intentarlo o escríbenos directamente.',
      );
    } finally {
      this.enviando.set(false);
    }
  }
}
