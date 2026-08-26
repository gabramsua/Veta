import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'veta-no-encontrado',
  imports: [RouterLink],
  template: `
    <section class="ne">
      <div class="vt-contenedor ne__cuerpo">
        <p class="vt-antetitulo">Error 404</p>
        <h1 class="vt-titulo--grande">Esta página<br />no existe</h1>
        <p class="vt-entradilla">
          Puede que el enlace esté mal escrito o que hayamos movido el contenido.
        </p>
        <a class="vt-boton" routerLink="/">Volver al inicio</a>
      </div>
    </section>
  `,
  styles: `
    .ne {
      display: grid;
      place-items: center;
      min-height: 70dvh;
      padding-block: 9.6rem;
    }

    .ne__cuerpo {
      display: grid;
      gap: 2.4rem;
      justify-items: start;
      max-width: 68rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoEncontrado {}
