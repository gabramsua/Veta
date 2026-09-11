import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';

import { BloqueTexto } from '../bloque-texto/bloque-texto';
import { Imagen } from '../../core/models';
import { tieneContenido } from '../../core/seo/quitar-html';

/**
 * Un tramo de página con una imagen y un texto con formato.
 *
 * La imagen puede ir a ancho completo con el texto debajo, o flotando a un lado
 * con el texto rodeándola. Lo decide `imagen.posicion`, que se elige desde el
 * panel.
 *
 * Existe para no repetir cinco veces la misma maquetación, que es donde estaba
 * antes: cada página pintaba su `<img>` y su `<veta-bloque-texto>` a mano, y
 * cambiar la colocación habría obligado a tocarlas todas.
 *
 * **Si no hay ni imagen ni texto, no se pinta nada.** Un bloque que se queda
 * vacío porque ya no se usa tiene que desaparecer, no dejar un título suelto ni
 * un aviso para el desarrollador.
 */
@Component({
  selector: 'veta-bloque-ilustrado',
  imports: [BloqueTexto],
  template: `
    @if (hayAlgo()) {
      <div
        class="bi"
        [class.bi--completa]="posicion() === 'completa'"
        [class.bi--izquierda]="posicion() === 'izquierda'"
        [class.bi--derecha]="posicion() === 'derecha'"
      >
        @if (imagen(); as foto) {
          <img
            class="bi__imagen"
            [src]="foto.url"
            [alt]="foto.alt"
            [attr.width]="foto.width"
            [attr.height]="foto.height"
            loading="lazy"
            decoding="async"
          />
        }

        @if (hayTexto()) {
          <veta-bloque-texto [html]="html()" />
        }
      </div>
    }
  `,
  styleUrl: './bloque-ilustrado.scss',
  /**
   * El texto lo pinta `BloqueTexto` con `[innerHTML]`, y esos elementos no
   * llevan el atributo de encapsulación. Para que el texto rodee de verdad a la
   * imagen flotante hay que poder alcanzarlos desde aquí.
   */
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BloqueIlustrado {
  readonly imagen = input<Imagen | null>(null);
  readonly html = input<string>('');

  protected readonly hayTexto = computed(() => tieneContenido(this.html()));
  protected readonly hayAlgo = computed(() => Boolean(this.imagen()) || this.hayTexto());

  // Las imágenes guardadas antes de que esto existiera no traen `posicion`.
  protected readonly posicion = computed(() => this.imagen()?.posicion ?? 'completa');
}
