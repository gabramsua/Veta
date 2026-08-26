import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

import { BloqueTexto } from '../../../shared/bloque-texto/bloque-texto';
import { CATEGORIAS_PRODUCTO } from '../../../core/models';
import {
  CATEGORIA_POR_SLUG,
  SECCION_PORTFOLIO_POR_CATEGORIA,
} from '../../../core/data/categorias-papeleria';
import { CabeceraSeccion } from '../../../shared/cabecera-seccion/cabecera-seccion';
import { Galeria } from '../../../shared/galeria/galeria';
import { PublicoService } from '../../../core/data/publico.service';
import { SeoService } from '../../../core/seo/seo.service';
import { textoPlano } from '../../../core/seo/quitar-html';

@Component({
  selector: 'veta-papeleria-detalle',
  imports: [RouterLink, CabeceraSeccion, BloqueTexto, Galeria],
  templateUrl: './papeleria-detalle.html',
  styleUrl: './papeleria-detalle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PapeleriaDetalle {
  // Llega por withComponentInputBinding desde el parámetro :categoria de la ruta.
  readonly categoria = input.required<string>();

  private readonly publico = inject(PublicoService);
  private readonly seo = inject(SeoService);

  private readonly productos = toSignal(this.publico.productosActivos(), { initialValue: [] });

  protected readonly clave = computed(() => CATEGORIA_POR_SLUG[this.categoria()] ?? null);

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

  // La entradilla se arma aquí y no en la plantilla: concatenar un `number | null`
  // con texto no pasa la comprobación estricta de plantillas.
  protected readonly entradilla = computed(() => {
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
