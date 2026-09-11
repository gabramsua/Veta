import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

import { BloqueIlustrado } from '../../../shared/bloque-ilustrado/bloque-ilustrado';
import { BloqueTexto } from '../../../shared/bloque-texto/bloque-texto';
import { CATEGORIAS_PRODUCTO, Imagen } from '../../../core/models';
import {
  CATEGORIA_POR_SLUG,
  SECCION_PORTFOLIO_POR_CATEGORIA,
} from '../../../core/data/categorias-papeleria';
import { CabeceraSeccion } from '../../../shared/cabecera-seccion/cabecera-seccion';
import { Fuente } from '../../../shared/fuente/fuente';
import { Galeria } from '../../../shared/galeria/galeria';
import { PaginasService } from '../../../core/data/paginas.service';
import { PublicoService } from '../../../core/data/publico.service';
import { SeoService } from '../../../core/seo/seo.service';
import { textoPlano, tieneContenido } from '../../../core/seo/quitar-html';
import { estilosPorDefecto, textosPorDefecto } from '../../../core/data/textos';

@Component({
  selector: 'veta-papeleria-detalle',
  imports: [RouterLink, CabeceraSeccion, BloqueTexto, BloqueIlustrado, Fuente, Galeria],
  templateUrl: './papeleria-detalle.html',
  styleUrl: './papeleria-detalle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PapeleriaDetalle {
  // Llega por withComponentInputBinding desde el parámetro :categoria de la ruta.
  readonly categoria = input.required<string>();

  // Jodit deja `<p><br></p>` al vaciar un campo, así que comprobar la cadena a
  // secas dejaría la sección en pie con todo su espaciado y nada dentro.
  protected readonly tieneContenido = tieneContenido;

  private readonly publico = inject(PublicoService);
  private readonly paginas = inject(PaginasService);
  private readonly seo = inject(SeoService);

  private readonly productos = toSignal(this.publico.productosActivos(), { initialValue: [] });

  protected readonly clave = computed(() => CATEGORIA_POR_SLUG[this.categoria()] ?? null);

  /**
   * Cada subsección tiene su propio documento en `pages`.
   *
   * Antes no tenían ninguno: el único texto de la página se generaba solo a
   * partir del precio más bajo, así que Carmen no podía escribir nada aquí.
   */
  private readonly slugPagina = computed(() => `papeleria-${this.clave() ?? 'invitaciones'}`);
  private readonly slug$ = toObservable(this.slugPagina);

  private readonly textos = toSignal(
    this.slug$.pipe(switchMap((slug) => this.paginas.textos(slug))),
    { initialValue: {} as Record<string, string> },
  );

  protected readonly imagenes = toSignal(
    this.slug$.pipe(switchMap((slug) => this.paginas.imagenes(slug))),
    { initialValue: {} as Record<string, Imagen> },
  );

  protected readonly estilos = toSignal(
    this.slug$.pipe(switchMap((slug) => this.paginas.estilos(slug))),
    { initialValue: estilosPorDefecto('papeleria-invitaciones') },
  );

  // Mientras Firestore responde se usan los valores del catálogo, para que no
  // haya un parpadeo con la página a medio montar.
  protected texto(clave: string): string {
    return this.textos()[clave] || textosPorDefecto(this.slugPagina())[clave] || '';
  }

  protected readonly enRejilla = computed(() => this.texto('modoCatalogo') !== 'bloques');

  protected readonly etiqueta = computed(() => {
    const clave = this.clave();
    return clave ? CATEGORIAS_PRODUCTO[clave] : 'Papelería';
  });

  protected readonly deLaCategoria = computed(() => {
    const clave = this.clave();
    return clave ? this.productos().filter((p) => p.categoria === clave) : [];
  });

  protected readonly desde = computed(() =>
    this.deLaCategoria().reduce<number | null>(
      (min, p) => (min === null || p.precioDesde < min ? p.precioDesde : min),
      null,
    ),
  );

  private readonly seccionPortfolio = computed(() => {
    const clave = this.clave();
    return clave ? SECCION_PORTFOLIO_POR_CATEGORIA[clave] : '';
  });

  protected readonly galeria = toSignal(
    toObservable(this.seccionPortfolio).pipe(
      switchMap((seccion) => this.publico.portfolioDe(seccion)),
    ),
    { initialValue: [] },
  );

  protected readonly existe = computed(() => this.clave() !== null);

  /**
   * La entradilla que haya escrito Carmen, y si no una armada con los precios.
   *
   * Se arma aquí y no en la plantilla porque concatenar un `number | null` con
   * texto no pasa la comprobación estricta de plantillas.
   */
  protected readonly entradilla = computed(() => {
    const propia = this.texto('entradilla');
    if (propia) return propia;

    const desde = this.desde();

    return desde === null
      ? 'Pídenos presupuesto sin compromiso.'
      : `Precios orientativos desde ${desde} €. El precio final depende de acabados, cantidad y plazos.`;
  });

  constructor() {
    effect(() => {
      if (!this.existe()) {
        this.seo.aplicar({
          titulo: 'Sección no encontrada · Veta',
          descripcion: 'Esta subsección de papelería no existe.',
          ruta: `/papeleria-de-bodas/${this.categoria()}`,
          noIndex: true,
        });
        return;
      }

      const primero = this.deLaCategoria()[0];

      this.seo.aplicar({
        titulo: `${this.etiqueta()} de boda · Veta Estudio Creativo`,
        descripcion:
          textoPlano(primero?.descripcion ?? '') ||
          `${this.etiqueta()} para bodas, hechas a mano en Sevilla. Precios orientativos y diseño a medida.`,
        ruta: `/papeleria-de-bodas/${this.categoria()}`,
        imagen: primero?.imagenes[0]?.url,
      });
      this.seo.datosEstructurados(null);
    });
  }
}
