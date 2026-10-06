import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { ConsentimientoInstagram } from '../../core/privacidad/consentimiento-instagram.service';
import { VideoInstagram } from './video-instagram';

/**
 * Los tres huecos de vídeo de una página, ya resueltos.
 *
 * Los campos viven en `textos` como `videoUnoUrl`, `videoUnoTitulo`… porque el
 * editor del panel es una lista de campos con nombre y no un constructor de
 * bloques. Este componente los recoge, descarta los vacíos y no pinta nada —ni
 * el título ni el espaciado de la sección— si no hay ninguno.
 */
@Component({
  selector: 'veta-videos-instagram',
  imports: [VideoInstagram],
  template: `
    @if (videos().length > 0) {
      <section class="vt-seccion" [class.vt-seccion--crema]="fondo() === 'crema'">
        <div class="vt-contenedor">
          <h2 class="vt-titulo vig-lista__titulo">{{ titulo() }}</h2>
          <div class="vig-lista">
            @for (video of videos(); track video.url) {
              <veta-video-instagram [url]="video.url" [titulo]="video.titulo" />
            }
          </div>

          @if (consentimiento.concedido()) {
            <p class="vig-lista__nota">
              Los vídeos se cargan desde Instagram porque diste tu permiso.
              <button type="button" class="vig-lista__revocar" (click)="consentimiento.revocar()">
                Dejar de cargarlos
              </button>
            </p>
          }
        </div>
      </section>
    }
  `,
  styleUrl: './videos-instagram.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideosInstagram {
  protected readonly consentimiento = inject(ConsentimientoInstagram);

  readonly textos = input<Record<string, string>>({});
  readonly titulo = input<string>('En vídeo');
  readonly fondo = input<'blanco' | 'crema'>('blanco');

  protected readonly videos = computed(() => {
    const t = this.textos();

    return ['Uno', 'Dos', 'Tres']
      .map((orden) => ({
        url: (t[`video${orden}Url`] ?? '').trim(),
        titulo: (t[`video${orden}Titulo`] ?? '').trim(),
      }))
      .filter((video) => video.url.length > 0);
  });
}
