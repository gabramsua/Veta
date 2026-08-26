import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'veta-envio-correcto',
  imports: [RouterLink],
  template: `
    <div class="ec">
      <p class="ec__icono" aria-hidden="true">✓</p>
      <h2 class="ec__titulo">{{ titulo() }}</h2>
      <p class="ec__texto">{{ texto() }}</p>
      <p class="ec__nota">
        Si no ves nuestro correo en un par de días, mira en la carpeta de spam o escríbenos.
      </p>
      <a class="vt-boton vt-boton--contorno" routerLink="/">Volver al inicio</a>
    </div>
  `,
  styles: `
    .ec {
      display: grid;
      gap: 1.6rem;
      justify-items: center;
      max-width: 60rem;
      padding: 4.8rem 3.2rem;
      margin-inline: auto;
      text-align: center;
      background-color: var(--veta-crema);
      border-radius: 0.8rem;
    }

    .ec__icono {
      display: grid;
      place-items: center;
      width: 6.4rem;
      height: 6.4rem;
      font-size: 2.8rem;
      color: var(--veta-crema);
      background-color: var(--veta-oliva);
      border-radius: 999rem;
    }

    .ec__titulo {
      font-size: 2.8rem;
    }

    .ec__texto {
      font-size: 1.8rem;
      color: var(--veta-tinta-suave);
    }

    .ec__nota {
      font-size: 1.3rem;
      color: var(--veta-tinta-suave);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnvioCorrecto {
  readonly titulo = input('Solicitud recibida');
  readonly texto = input('Te responderemos lo antes posible.');
}
