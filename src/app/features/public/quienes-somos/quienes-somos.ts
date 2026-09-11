import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Imagen } from '../../../core/models';

import { BloqueTexto } from '../../../shared/bloque-texto/bloque-texto';
import { CabeceraSeccion } from '../../../shared/cabecera-seccion/cabecera-seccion';
import { PaginasService } from '../../../core/data/paginas.service';
import { SeoService } from '../../../core/seo/seo.service';
import { textoPlano } from '../../../core/seo/quitar-html';
import { estilosPorDefecto, textosPorDefecto } from '../../../core/data/textos';
import { Fuente } from '../../../shared/fuente/fuente';

const SLUG = 'quienes-somos';

@Component({
  selector: 'veta-quienes-somos',
  imports: [CabeceraSeccion, BloqueTexto, Fuente],
  templateUrl: './quienes-somos.html',
  styleUrl: './quienes-somos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuienesSomos {
  private readonly paginas = inject(PaginasService);
  private readonly seo = inject(SeoService);

  protected readonly textos = toSignal(this.paginas.textos(SLUG), {
    initialValue: textosPorDefecto(SLUG),
  });

  protected readonly imagenes = toSignal(this.paginas.imagenes(SLUG), { initialValue: {} as Record<string, Imagen> });

  protected readonly estilos = toSignal(this.paginas.estilos(SLUG), {
    initialValue: estilosPorDefecto(SLUG),
  });

  // Cada renglón de la frase se escribe en una línea del panel.
  protected readonly lineasEslogan = computed(() =>
    (this.textos()['esloganFrase'] ?? '').split('\n').filter((l) => l.trim().length > 0),
  );

  private readonly seoPagina = toSignal(this.paginas.seo(SLUG), {
    initialValue: { title: '', description: '', ogImage: '' },
  });

  constructor() {
    effect(() => {
      const propio = this.seoPagina();
      const t = this.textos();

      this.seo.aplicar({
        titulo: propio.title || 'Quiénes somos · Veta Estudio Creativo',
        descripcion:
          propio.description || textoPlano(t['entradilla'] || t['queEsTexto'] || ''),
        ruta: '/quienes-somos',
        imagen: propio.ogImage || undefined,
      });
      this.seo.datosEstructurados(null);
    });
  }
}
