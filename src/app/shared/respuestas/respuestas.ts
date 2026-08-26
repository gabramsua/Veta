import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface Fila {
  etiqueta: string;
  valor: string;
}

/**
 * Pinta el mapa de respuestas de un formulario.
 *
 * Cada respuesta se guardó junto a su etiqueta (`{id}` y `{id}__etiqueta`), así
 * que sigue siendo legible aunque la pregunta ya no exista en el panel.
 */
@Component({
  selector: 'veta-respuestas',
  template: `
    @if (filas().length > 0) {
      <dl class="rs">
        @for (fila of filas(); track fila.etiqueta) {
          <div class="rs__fila">
            <dt class="rs__etiqueta">{{ fila.etiqueta }}</dt>
            <dd class="rs__valor">{{ fila.valor }}</dd>
          </div>
        }
      </dl>
    } @else {
      <p class="rs__vacio">Sin respuestas adicionales.</p>
    }
  `,
  styles: `
    .rs {
      display: grid;
      gap: 1.2rem;
      margin: 0;
    }

    .rs__fila {
      display: grid;
      grid-template-columns: 22rem 1fr;
      gap: 1.6rem;
    }

    @media (max-width: 767.98px) {
      .rs__fila {
        grid-template-columns: 1fr;
        gap: 0.2rem;
      }
    }

    .rs__etiqueta {
      font-size: 1.2rem;
      color: var(--veta-tinta-suave);
    }

    .rs__valor {
      margin: 0;
      font-size: 1.4rem;
      white-space: pre-wrap;
    }

    .rs__vacio {
      font-size: 1.3rem;
      font-style: italic;
      color: var(--veta-tinta-suave);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Respuestas {
  readonly datos = input.required<Record<string, string>>();

  protected readonly filas = computed<Fila[]>(() => {
    const datos = this.datos() ?? {};

    return Object.entries(datos)
      .filter(([clave]) => !clave.endsWith('__etiqueta'))
      .map(([clave, valor]) => ({
        etiqueta: datos[`${clave}__etiqueta`] ?? 'Respuesta',
        valor,
      }));
  });
}
