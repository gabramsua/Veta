import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { AJUSTES_POR_DEFECTO, CATEGORIAS_PRODUCTO, CategoriaProducto, Imagen } from '../../../core/models';
import { AjustesService } from '../../../core/data/ajustes.service';
import { PaginasService } from '../../../core/data/paginas.service';
import { PublicoService } from '../../../core/data/publico.service';
import { SeoService } from '../../../core/seo/seo.service';
import { formatearFecha } from '../../../core/data/fechas';
import { estilosPorDefecto, textosPorDefecto } from '../../../core/data/textos';
import { Fuente } from '../../../shared/fuente/fuente';

const RUTAS_PAPELERIA: Record<CategoriaProducto, string> = {
  invitaciones: '/papeleria-de-bodas/invitaciones',
  seating: '/papeleria-de-bodas/seating',
  minutas: '/papeleria-de-bodas/minutas',
  marcasitios: '/papeleria-de-bodas/marcasitios',
  laminas: '/papeleria-de-bodas/laminas',
  pack: '/papeleria-de-bodas/pack',
};

@Component({
  selector: 'veta-home',
  imports: [RouterLink, Fuente],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly publico = inject(PublicoService);
  private readonly paginas = inject(PaginasService);
  private readonly seo = inject(SeoService);
  private readonly ajustesService = inject(AjustesService);

  protected readonly formatearFecha = formatearFecha;

  protected readonly textos = toSignal(this.paginas.textos('home'), {
    initialValue: textosPorDefecto('home'),
  });

  // Imágenes propias de la portada, elegidas desde Panel → La web → Portada.
  protected readonly imagenes = toSignal(this.paginas.imagenes('home'), { initialValue: {} as Record<string, Imagen> });

  protected readonly ajustes = toSignal(this.ajustesService.ajustes$, {
    initialValue: AJUSTES_POR_DEFECTO,
  });

  protected readonly productos = toSignal(this.publico.productosActivos(), { initialValue: [] });
  protected readonly sesiones = toSignal(this.publico.proximasSesiones(3), { initialValue: [] });
  protected readonly frases = toSignal(this.publico.frasesActivas(), { initialValue: [] });
  private readonly seoPagina = toSignal(this.paginas.seo('home'), {
    initialValue: { title: '', description: '', ogImage: '' },
  });

  protected readonly destacados = computed(() =>
    this.productos()
      .filter((p) => p.destacado && p.imagenes.length > 0)
      .slice(0, 3),
  );

  // Una tarjeta por subsección de papelería, con el precio más bajo de cada una.
  protected readonly categoriasPapeleria = computed(() => {
    const productos = this.productos();

    return (Object.entries(CATEGORIAS_PRODUCTO) as [CategoriaProducto, string][]).map(
      ([clave, etiqueta]) => {
        const deLaCategoria = productos.filter((p) => p.categoria === clave);
        const masBarato = deLaCategoria.reduce<number | null>(
          (min, p) => (min === null || p.precioDesde < min ? p.precioDesde : min),
          null,
        );

        return {
          clave,
          etiqueta,
          ruta: RUTAS_PAPELERIA[clave],
          imagen: deLaCategoria.find((p) => p.imagenes.length > 0)?.imagenes[0] ?? null,
          desde: masBarato,
          unidad: deLaCategoria[0]?.unidad ?? 'unidad',
        };
      },
    );
  });

  // La familia de cada texto se elige desde el panel; el catálogo pone la de
  // partida. Ver `estilosPorDefecto` en core/data/textos.ts.
  protected readonly estilos = toSignal(this.paginas.estilos('home'), {
    initialValue: estilosPorDefecto('home'),
  });

  protected readonly lineasHero = computed(() =>
    (this.textos()['heroTitulo'] ?? '').split('\n').filter((l) => l.trim().length > 0),
  );

  protected readonly lineasManifiesto = computed(() =>
    (this.textos()['manifiestoFrase'] ?? '').split('\n').filter((l) => l.trim().length > 0),
  );

  constructor() {
    effect(() => {
      const personalizado = this.seoPagina();

      this.seo.aplicar({
        titulo: personalizado.title || 'Veta · Estudio creativo en Sevilla',
        descripcion:
          personalizado.description ||
          'Papelería de bodas hecha a mano, acuarela en directo y talleres presenciales en Sevilla.',
        ruta: '/',
        imagen: personalizado.ogImage || undefined,
      });

      this.seo.datosEstructurados(this.seo.negocioLocal(this.ajustes().contacto));
    });
  }
}
