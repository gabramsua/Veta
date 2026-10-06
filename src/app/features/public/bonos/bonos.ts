import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { BloqueTexto } from '../../../shared/bloque-texto/bloque-texto';
import { CATEGORIAS_BONO, CategoriaBono } from '../../../core/models';
import { CabeceraSeccion } from '../../../shared/cabecera-seccion/cabecera-seccion';
import { Fuente } from '../../../shared/fuente/fuente';
import { PaginasService } from '../../../core/data/paginas.service';
import { PublicoService } from '../../../core/data/publico.service';
import { SeoService } from '../../../core/seo/seo.service';
import { separarPrimeraImagen } from '../../../core/seo/separar-imagen';
import { textoPlano, tieneContenido } from '../../../core/seo/quitar-html';
import { estilosPorDefecto, textosPorDefecto } from '../../../core/data/textos';

const SLUG = 'talleres-bonos';

@Component({
  selector: 'veta-bonos-publico',
  imports: [RouterLink, CabeceraSeccion, BloqueTexto, Fuente],
  templateUrl: './bonos.html',
  styleUrl: './bonos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bonos {
  // Jodit deja `<p><br></p>` al vaciar un campo, así que comprobar la cadena a
  // secas dejaría la sección en pie con todo su espaciado y nada dentro.
  protected readonly tieneContenido = tieneContenido;

  private readonly publico = inject(PublicoService);
  private readonly paginas = inject(PaginasService);
  private readonly seo = inject(SeoService);

  private readonly lista = toSignal(this.publico.bonosActivos(), { initialValue: [] });

  /**
   * La foto sale del texto y pasa a ser un dato de la tarjeta.
   *
   * Así la ficha la coloca en su columna de la derecha, sin que dependa de en
   * qué punto de la descripción la pegara Carmen.
   */
  protected readonly bonos = computed(() =>
    this.lista().map((bono) => {
      const { imagen, texto } = separarPrimeraImagen(bono.descripcion);
      return { ...bono, foto: imagen, descripcionSinFoto: texto };
    }),
  );

  protected readonly textos = toSignal(this.paginas.textos(SLUG), {
    initialValue: textosPorDefecto(SLUG),
  });

  protected readonly estilos = toSignal(this.paginas.estilos(SLUG), {
    initialValue: estilosPorDefecto(SLUG),
  });

  private readonly seoPagina = toSignal(this.paginas.seo(SLUG), {
    initialValue: { title: '', description: '', ogImage: '' },
  });

  protected nombreCategoria(categoria: CategoriaBono): string {
    return CATEGORIAS_BONO[categoria] ?? '';
  }

  protected porSesion(precio: number, sesiones: number): string {
    if (sesiones <= 0) return '';
    return `${(precio / sesiones).toFixed(2).replace('.', ',')} € por sesión`;
  }

  constructor() {
    effect(() => {
      const propio = this.seoPagina();
      const t = this.textos();

      this.seo.aplicar({
        titulo: propio.title || 'Bonos de talleres · Veta, Sevilla',
        descripcion:
          propio.description ||
          textoPlano(t['entradilla'] || t['texto'] || '') ||
          'Bonos de cerámica, pintura e infantil en nuestro estudio de Sevilla.',
        ruta: '/talleres/bonos',
        imagen: propio.ogImage || undefined,
      });
      this.seo.datosEstructurados(null);
    });
  }
}
