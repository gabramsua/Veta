import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';

import { HtmlSeguroPipe } from '../html-seguro.pipe';
import { tieneContenido } from '../../core/seo/quitar-html';

// Pinta el HTML que ha escrito una administradora desde Jodit. Nunca se usa con
// contenido que venga de un formulario público.
@Component({
  selector: 'veta-bloque-texto',
  imports: [HtmlSeguroPipe],
  template: `
    @if (hayContenido()) {
      <div class="bt" [class.bt--compacto]="compacto()" [innerHTML]="html() | htmlSeguro"></div>
    }
  `,
  styles: `
    .bt {
      max-width: var(--ancho-texto);
      font-size: var(--txt-md);
      color: var(--veta-tinta-suave);
    }

    .bt :is(p, ul, ol) {
      margin-bottom: 1.6rem;
    }

    .bt :is(h2, h3) {
      margin-block: 3.2rem 1.2rem;
      font-family: var(--fuente-titular);
      font-size: var(--txt-lg);
      color: var(--veta-tinta);
    }

    .bt a {
      color: var(--veta-terracota);
      text-decoration: underline;
    }

    .bt :is(ul, ol) {
      padding-left: 2.4rem;
    }

    .bt strong {
      color: var(--veta-tinta);
    }

    /* Imágenes insertadas dentro del texto desde el panel. */
    .bt__imagen {
      display: block;
      height: auto;
      margin-block: 3.2rem;
      border-radius: var(--radio-md);
    }

    .bt__imagen--completa {
      width: 100%;
    }

    .bt__imagen--media {
      width: 65%;
      margin-inline: auto;
    }

    .bt__imagen--pequena {
      width: 40%;
      margin-inline: auto;
    }

    /**
     * Variante para texto dentro de una tarjeta, no a lo ancho de una página.
     *
     * La foto principal de la tarjeta no llega hasta aquí: quien la usa la saca
     * antes con separarPrimeraImagen() y la coloca por rejilla. Lo que queda
     * son las imágenes de más, si Carmen pone varias, y en una ficha estrecha
     * los tres anchos de página no tienen sentido: van todas a ancho completo
     * y con menos aire alrededor.
     */
    .bt--compacto {
      font-size: var(--txt-base);
    }

    .bt--compacto .bt__imagen {
      width: 100%;
      margin-block: var(--esp-3);
    }

    /* En móvil no hay sitio para medias tintas: todas a ancho completo. */
    @media (max-width: 599.98px) {
      .bt__imagen--media,
      .bt__imagen--pequena {
        width: 100%;
      }
    }
  `,
  /**
   * Sin encapsular, y no es opcional.
   *
   * Con la encapsulación emulada, Angular marca con un atributo los elementos
   * que están en la plantilla y acota cada selector a ese atributo. El HTML que
   * entra por `[innerHTML]` se inserta después y no lo lleva, así que ninguna
   * regla de las de aquí abajo llegaba a aplicarse: se veía el contenedor con
   * su ancho y su color, y dentro los estilos por defecto del navegador.
   *
   * Todos los selectores empiezan por `.bt`, así que sacarlos del ámbito del
   * componente no pisa nada.
   */
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BloqueTexto {
  readonly html = input<string>('');

  /** Para el texto que va dentro de una tarjeta, no a lo ancho de una página. */
  readonly compacto = input(false);

  // Jodit deja `<p><br></p>` al vaciar un campo. Sin esta comprobación se
  // pintaría un contenedor con un párrafo vacío dentro.
  protected readonly hayContenido = computed(() => tieneContenido(this.html()));
}
