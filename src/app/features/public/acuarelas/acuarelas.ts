import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { Imagen } from '../../../core/models';

import { BloqueIlustrado } from '../../../shared/bloque-ilustrado/bloque-ilustrado';
import { BloqueTexto } from '../../../shared/bloque-texto/bloque-texto';
import { CabeceraSeccion } from '../../../shared/cabecera-seccion/cabecera-seccion';
import { Galeria } from '../../../shared/galeria/galeria';
import { PaginasService } from '../../../core/data/paginas.service';
import { PublicoService } from '../../../core/data/publico.service';
import { SeoService } from '../../../core/seo/seo.service';
import { textoPlano, tieneContenido } from '../../../core/seo/quitar-html';
import { textosPorDefecto } from '../../../core/data/textos';

const SLUG = 'acuarelas-y-encargos';

@Component({
  selector: 'veta-acuarelas',
  imports: [RouterLink, CabeceraSeccion, BloqueTexto, BloqueIlustrado, Galeria],
  templateUrl: './acuarelas.html',
  styleUrl: './acuarelas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Acuarelas {
  // Jodit deja `<p><br></p>` al vaciar un campo, así que comprobar la cadena a
  // secas dejaría la sección en pie con todo su espaciado y nada dentro.
  protected readonly tieneContenido = tieneContenido;

  private readonly paginas = inject(PaginasService);
  private readonly publico = inject(PublicoService);
  private readonly seo = inject(SeoService);

  protected readonly textos = toSignal(this.paginas.textos(SLUG), {
    initialValue: textosPorDefecto(SLUG),
  });

  protected readonly imagenes = toSignal(this.paginas.imagenes(SLUG), { initialValue: {} as Record<string, Imagen> });

  protected readonly galeria = toSignal(this.publico.portfolioDe('acuarelas'), {
    initialValue: [],
  });

  private readonly seoPagina = toSignal(this.paginas.seo(SLUG), {
    initialValue: { title: '', description: '', ogImage: '' },
  });

  constructor() {
    effect(() => {
      const propio = this.seoPagina();
      const t = this.textos();

      this.seo.aplicar({
        titulo: propio.title || 'Acuarelas por encargo en Sevilla · Veta Estudio Creativo',
        descripcion:
          propio.description || textoPlano(t['entradilla'] || t['texto'] || '') || 'Acuarelas por encargo pintadas a mano en Sevilla.',
        ruta: '/acuarelas-y-encargos',
        imagen: propio.ogImage || this.galeria()[0]?.imagen.url,
      });
      this.seo.datosEstructurados(null);
    });
  }
}
