import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'veta-cabecera-seccion',
  template: `
    <header class="cs">
      <div class="vt-contenedor cs__cuerpo">
        @if (antetitulo()) {
          <p class="vt-antetitulo">{{ antetitulo() }}</p>
        }
        <h1 class="vt-titulo cs__titulo">{{ titulo() }}</h1>
        @if (entradilla()) {
          <p class="vt-entradilla cs__entradilla">{{ entradilla() }}</p>
        }
      </div>
    </header>
  `,
  styles: `
    /* La cabecera del sitio es sticky, o sea que ocupa sitio en el flujo.
       Los 12rem de antes venían de dar por hecho que era fija, y se sumaban a
       los 8rem del menú: casi 200px de vacío antes del título. */
    .cs {
      padding-block: 5.6rem 4rem;
      background-color: var(--veta-crema);
    }

    .cs__cuerpo {
      display: grid;
      gap: 1.6rem;
      max-width: 88rem;
    }

    .cs__titulo {
      max-width: 20ch;
    }

    .cs__entradilla {
      margin-top: 0.8rem;
    }

    @media (max-width: 767.98px) {
      .cs {
        padding-block: 4rem 3.2rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabeceraSeccion {
  readonly antetitulo = input('');
  readonly titulo = input.required<string>();
  readonly entradilla = input('');
}
