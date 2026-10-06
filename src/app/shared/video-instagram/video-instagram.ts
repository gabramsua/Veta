import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ConsentimientoInstagram } from '../../core/privacidad/consentimiento-instagram.service';

/**
 * Un vídeo de Instagram que no carga nada hasta que alguien lo pide.
 *
 * Mientras no se pulsa, esto es una tarjeta con un botón: cero peticiones a
 * Meta, cero cookies, cero datos de la visitante enviados a ninguna parte. El
 * `<iframe>` solo se crea al hacer clic.
 *
 * No es una preferencia estética: incrustar Instagram de entrada pone cookies
 * de terceros antes de que nadie consienta, y eso obligaría a un banner de
 * consentimiento en toda la web y a rehacer los textos legales. Con el clic de
 * por medio, la visitante decide, y `DATOS-LEGALES.md` sigue siendo cierto.
 *
 * Aun así hay que mencionar en la política de privacidad que al pulsar se
 * conecta con Meta (`pendientes.md` C5).
 */
@Component({
  selector: 'veta-video-instagram',
  template: `
    @if (!visible()) {
      <button type="button" class="vig" (click)="activar()">
        <span class="vig__play" aria-hidden="true">▶</span>
        <span class="vig__texto">
          <span class="vig__titulo">{{ titulo() || 'Ver el vídeo' }}</span>
          <span class="vig__aviso">Se carga desde Instagram al pulsar</span>
        </span>
      </button>
    } @else if (incrustable()) {
      <iframe
        class="vig__marco"
        [src]="incrustable()"
        [title]="titulo() || 'Vídeo de Instagram'"
        loading="lazy"
        allowfullscreen
      ></iframe>
    }
  `,
  styleUrl: './video-instagram.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoInstagram {
  readonly url = input<string>('');
  readonly titulo = input<string>('');

  private readonly sanitizer = inject(DomSanitizer);
  private readonly consentimiento = inject(ConsentimientoInstagram);

  private readonly pulsado = signal(false);

  /**
   * Se ve el vídeo si esta visitante lo ha pedido, ahora o en otra visita.
   *
   * El primer clic vale para todos los demás: quien ya ha dicho que sí no tiene
   * que repetirlo vídeo a vídeo ni cada vez que entra.
   */
  protected readonly visible = computed(() => this.pulsado() || this.consentimiento.concedido());

  /**
   * La dirección del reproductor, a partir del enlace que pega Carmen.
   *
   * Instagram acepta `/p/`, `/reel/` y `/tv/`, y el reproductor se monta
   * añadiendo `/embed`. Se reconstruye la URL en vez de concatenar sobre la que
   * llega para que un enlace con parámetros de seguimiento —los `?igsh=` que
   * salen al compartir— no acabe dentro del `src`.
   *
   * Si el enlace no es de Instagram, no se pinta nada: mejor un hueco que un
   * marco roto.
   */
  protected readonly incrustable = computed<SafeResourceUrl | null>(() => {
    const codigo = /instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/.exec(this.url().trim());

    if (!codigo) return null;

    /**
     * Angular bloquea cualquier cadena en el `src` de un `iframe`, y con razón:
     * ahí se puede colar un `javascript:`. Aquí es seguro porque no se usa lo
     * que llega: se reconstruye la dirección a partir del código, y ese código
     * ya ha pasado por una expresión que solo admite letras, números, guion y
     * guion bajo.
     */
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.instagram.com/p/${codigo[1]}/embed/`,
    );
  });

  protected activar(): void {
    this.pulsado.set(true);
    this.consentimiento.conceder();
  }
}
