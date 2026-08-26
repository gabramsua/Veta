import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

// Subir y bajar en lugar de arrastrar y soltar: funciona con teclado, con lector
// de pantalla y en móvil sin librerías extra.
@Component({
  selector: 'veta-ordenar',
  template: `
    <div class="ord">
      <button
        type="button"
        class="ord__boton"
        [disabled]="primero()"
        [attr.aria-label]="'Subir ' + nombre()"
        (click)="subir.emit()"
      >
        ↑
      </button>
      <button
        type="button"
        class="ord__boton"
        [disabled]="ultimo()"
        [attr.aria-label]="'Bajar ' + nombre()"
        (click)="bajar.emit()"
      >
        ↓
      </button>
    </div>
  `,
  styles: `
    .ord {
      display: inline-flex;
      gap: 0.4rem;
    }

    .ord__boton {
      width: 2.8rem;
      height: 2.8rem;
      font-size: 1.4rem;
      line-height: 1;
      color: var(--veta-tinta-suave);
      border: 1px solid var(--veta-arena-osc);
      border-radius: 0.4rem;
      transition: background-color 150ms ease;
    }

    .ord__boton:hover:not(:disabled) {
      color: var(--veta-tinta);
      background-color: var(--veta-crema);
    }

    .ord__boton:disabled {
      cursor: not-allowed;
      opacity: 0.35;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ordenar {
  readonly nombre = input('elemento');
  readonly primero = input(false);
  readonly ultimo = input(false);
  readonly subir = output<void>();
  readonly bajar = output<void>();
}
