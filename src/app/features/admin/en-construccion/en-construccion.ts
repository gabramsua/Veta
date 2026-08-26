import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'veta-en-construccion',
  imports: [RouterLink],
  template: `
    <div class="vt-adm-vacio ec">
      <p class="vt-adm-vacio__icono" aria-hidden="true">◇</p>
      <h1 class="ec__titulo">Esta sección todavía no está lista</h1>
      <p>
        La ruta <code class="ec__ruta">{{ ruta }}</code> se implementa en una fase posterior.
      </p>
      <a class="vt-adm-boton vt-adm-boton--fantasma" routerLink="/panel/inicio">
        Volver al inicio del panel
      </a>
    </div>
  `,
  styles: `
    .ec {
      gap: 1.6rem;
    }

    .ec__titulo {
      font-family: var(--fuente-cuerpo);
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--veta-tinta);
    }

    .ec__ruta {
      padding: 0.2rem 0.6rem;
      font-family: ui-monospace, monospace;
      font-size: 1.3rem;
      background-color: var(--veta-crema);
      border-radius: 0.4rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnConstruccion {
  protected readonly ruta = inject(Router).url;
}
