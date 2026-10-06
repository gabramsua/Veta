import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

import { Imagen } from '../../../core/models';

import { BloqueIlustrado } from '../../../shared/bloque-ilustrado/bloque-ilustrado';
import { BloqueTexto } from '../../../shared/bloque-texto/bloque-texto';
import { CabeceraSeccion } from '../../../shared/cabecera-seccion/cabecera-seccion';
import { PaginasService } from '../../../core/data/paginas.service';
import { SeoService } from '../../../core/seo/seo.service';
import { VideosInstagram } from '../../../shared/video-instagram/videos-instagram';
import { textoPlano, tieneContenido } from '../../../core/seo/quitar-html';
import { paginaEditable, textosPorDefecto } from '../../../core/data/textos';

/**
 * Las dos subpáginas de Live art.
 *
 * Un solo componente para las dos porque su estructura es idéntica y lo único
 * que cambia es de qué documento de `pages` leen. Duplicarlo habría significado
 * arreglar cada retoque dos veces.
 *
 * El slug llega por `data` de la ruta, que Angular enlaza al input igual que un
 * parámetro de URL.
 */
@Component({
  selector: 'veta-live-art-sub',
  imports: [RouterLink, CabeceraSeccion, BloqueTexto, BloqueIlustrado, VideosInstagram],
  templateUrl: './live-art-sub.html',
  styleUrl: './live-art-sub.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveArtSub {
  readonly slug = input.required<string>();

  // Jodit deja `<p><br></p>` al vaciar un campo, así que comprobar la cadena a
  // secas dejaría la sección en pie con todo su espaciado y nada dentro.
  protected readonly tieneContenido = tieneContenido;

  private readonly paginas = inject(PaginasService);
  private readonly seo = inject(SeoService);

  private readonly slug$ = toObservable(this.slug);

  protected readonly definicion = computed(() => paginaEditable(this.slug()));

  protected readonly textos = toSignal(
    this.slug$.pipe(switchMap((slug) => this.paginas.textos(slug))),
    { initialValue: {} as Record<string, string> },
  );

  protected readonly imagenes = toSignal(
    this.slug$.pipe(switchMap((slug) => this.paginas.imagenes(slug))),
    { initialValue: {} as Record<string, Imagen> },
  );

  private readonly seoPagina = toSignal(
    this.slug$.pipe(switchMap((slug) => this.paginas.seo(slug))),
    { initialValue: { title: '', description: '', ogImage: '' } },
  );

  // Mientras Firestore responde se usan los valores del catálogo, para que no
  // haya un parpadeo con la página vacía.
  protected readonly valor = computed(() => {
    const guardados = this.textos();
    const defecto = textosPorDefecto(this.slug());

    return (clave: string) => guardados[clave] || defecto[clave] || '';
  });

  constructor() {
    effect(() => {
      const propio = this.seoPagina();
      const def = this.definicion();

      this.seo.aplicar({
        titulo: propio.title || `${def?.nombre ?? 'Live art'} en Sevilla · Veta Estudio Creativo`,
        descripcion:
          propio.description ||
          textoPlano(this.valor()('entradilla') || this.valor()('texto')) ||
          'Acuarelas en directo y por encargo para bodas, en Sevilla.',
        ruta: def?.ruta ?? '/live-art',
        imagen: propio.ogImage,
      });

      this.seo.datosEstructurados(
        this.seo.migasDePan([
          { nombre: 'Inicio', url: '/' },
          { nombre: 'Live art', url: '/live-art' },
          { nombre: def?.nombre ?? 'Live art', url: def?.ruta ?? '/live-art' },
        ]),
      );
    });
  }
}
