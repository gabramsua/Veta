import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { BloqueTexto } from '../../../shared/bloque-texto/bloque-texto';
import { CATEGORIAS_PRODUCTO, CategoriaProducto } from '../../../core/models';
import { CabeceraSeccion } from '../../../shared/cabecera-seccion/cabecera-seccion';
import { PaginasService } from '../../../core/data/paginas.service';
import { PublicoService } from '../../../core/data/publico.service';
import { SeoService } from '../../../core/seo/seo.service';
import { SLUG_POR_CATEGORIA } from '../../../core/data/categorias-papeleria';
import { textosPorDefecto } from '../../../core/data/textos';
import { tieneContenido } from '../../../core/seo/quitar-html';

const SLUG = 'papeleria-de-bodas';

@Component({
  selector: 'veta-papeleria',
  imports: [RouterLink, CabeceraSeccion, BloqueTexto],
  templateUrl: './papeleria.html',
  styleUrl: './papeleria.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Papeleria {
  // Jodit deja `<p><br></p>` al vaciar un campo, así que comprobar la cadena a
  // secas dejaría la sección en pie con todo su espaciado y nada dentro.
  protected readonly tieneContenido = tieneContenido;

  private readonly publico = inject(PublicoService);
  private readonly paginas = inject(PaginasService);
  private readonly seo = inject(SeoService);

  protected readonly textos = toSignal(this.paginas.textos(SLUG), {
    initialValue: textosPorDefecto(SLUG),
  });

  private readonly productos = toSignal(this.publico.productosActivos(), { initialValue: [] });
  private readonly seoPagina = toSignal(this.paginas.seo(SLUG), {
    initialValue: { title: '', description: '', ogImage: '' },
  });

  protected readonly categorias = computed(() => {
    const productos = this.productos();

    return (Object.entries(CATEGORIAS_PRODUCTO) as [CategoriaProducto, string][]).map(
      ([clave, etiqueta]) => {
        const deLaCategoria = productos.filter((p) => p.categoria === clave);
        const desde = deLaCategoria.reduce<number | null>(
          (min, p) => (min === null || p.precioDesde < min ? p.precioDesde : min),
          null,
        );

        return {
          clave,
          etiqueta,
          ruta: `/papeleria-de-bodas/${SLUG_POR_CATEGORIA[clave]}`,
          imagen: deLaCategoria.find((p) => p.imagenes.length > 0)?.imagenes[0] ?? null,
          cuantos: deLaCategoria.length,
          desde,
          unidad: deLaCategoria[0]?.unidad ?? 'unidad',
        };
      },
    );
  });

  constructor() {
    effect(() => {
      const propio = this.seoPagina();

      this.seo.aplicar({
        titulo: propio.title || 'Papelería de bodas · Veta Estudio Creativo',
        descripcion:
          propio.description ||
          'Invitaciones, seating plan, meseros, minutas, marcasitios y láminas personalizadas, hechas a mano en Sevilla.',
        ruta: '/papeleria-de-bodas',
        imagen: propio.ogImage || undefined,
      });
      this.seo.datosEstructurados(null);
    });
  }
}
