import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { AJUSTES_POR_DEFECTO } from '../../../core/models';
import { AjustesService } from '../../../core/data/ajustes.service';
import { BloqueTexto } from '../../../shared/bloque-texto/bloque-texto';
import { CabeceraSeccion } from '../../../shared/cabecera-seccion/cabecera-seccion';
import { DatosEnviados, FormularioSolicitud } from '../../../shared/formulario-solicitud/formulario-solicitud';
import { EnvioCorrecto } from '../../../shared/envio-correcto/envio-correcto';
import { PaginasService } from '../../../core/data/paginas.service';
import { SeoService } from '../../../core/seo/seo.service';
import { SolicitudesService } from '../../../core/data/solicitudes.service';
import { textosPorDefecto } from '../../../core/data/textos';
import { tieneContenido } from '../../../core/seo/quitar-html';

const SLUG = 'contacto';

@Component({
  selector: 'veta-contacto',
  imports: [CabeceraSeccion, BloqueTexto, FormularioSolicitud, EnvioCorrecto],
  templateUrl: './contacto.html',
  styleUrl: './contacto.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contacto {
  // Jodit deja `<p><br></p>` al vaciar un campo. Sin esto, el hueco del texto
  // seguiría contando en la rejilla y separaría la cabecera del formulario.
  protected readonly tieneContenido = tieneContenido;

  private readonly paginas = inject(PaginasService);
  private readonly ajustesService = inject(AjustesService);
  private readonly seo = inject(SeoService);
  private readonly solicitudes = inject(SolicitudesService);

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly error = signal('');

  protected readonly textos = toSignal(this.paginas.textos(SLUG), {
    initialValue: textosPorDefecto(SLUG),
  });

  protected readonly ajustes = toSignal(this.ajustesService.ajustes$, {
    initialValue: AJUSTES_POR_DEFECTO,
  });

  constructor() {
    effect(() => {
      this.seo.aplicar({
        titulo: 'Contacto · Veta Estudio Creativo, Sevilla',
        descripcion:
          'Escríbenos y te preparamos un presupuesto a medida para tu papelería de boda, encargo o taller.',
        ruta: '/contacto',
      });

      this.seo.datosEstructurados(
        this.seo.negocioLocal(this.ajustes().contacto, this.ajustes().redes),
      );
    });
  }

  protected async enviar(datos: DatosEnviados): Promise<void> {
    if (this.enviando()) return;

    this.enviando.set(true);
    this.error.set('');

    try {
      await this.solicitudes.enviar({
        tipo: 'contacto',
        piezas: [],
        nombre: datos.nombre,
        email: datos.email,
        telefono: datos.telefono,
        respuestas: datos.respuestas,
      });

      this.enviado.set(true);
    } catch {
      this.error.set('No hemos podido enviar el mensaje. Inténtalo de nuevo o escríbenos al correo.');
    } finally {
      this.enviando.set(false);
    }
  }
}
