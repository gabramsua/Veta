import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { Imagen } from '../../../core/models';

import { BloqueTexto } from '../../../shared/bloque-texto/bloque-texto';
import { CabeceraSeccion } from '../../../shared/cabecera-seccion/cabecera-seccion';
import { Galeria } from '../../../shared/galeria/galeria';
import { PaginasService } from '../../../core/data/paginas.service';
import { PublicoService } from '../../../core/data/publico.service';
import { SeoService } from '../../../core/seo/seo.service';
import { textoPlano } from '../../../core/seo/quitar-html';
import { textosPorDefecto } from '../../../core/data/textos';

const SLUG = 'acuarelas-y-encargos';

@Component({
  selector: 'veta-acuarelas',
  imports: [RouterLink, CabeceraSeccion, BloqueTexto, Galeria],
  templateUrl: './acuarelas.html',
  styleUrl: './acuarelas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Acuarelas {
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
        titulo: propio.title || 'Acuarelas y encargos · Veta Estudio Creativo',
        descripcion:
          propio.description || textoPlano(t['entradilla'] || t['texto'] || '') || 'Acuarelas por encargo pintadas a mano en Sevilla.',
        ruta: '/acuarelas-y-encargos',
        imagen: propio.ogImage || this.galeria()[0]?.imagen.url,
      });
      this.seo.datosEstructurados(null);
    });
  }
}
