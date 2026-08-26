import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'veta-estado-vacio',
  template: `
    <div class="vt-adm-vacio">
      <p class="vt-adm-vacio__icono" aria-hidden="true">◇</p>
      <p class="ev__titulo">{{ titulo() }}</p>
      @if (pista()) {
        <p class="ev__pista">{{ pista() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .ev__titulo {
      font-size: 1.6rem;
      color: var(--veta-tinta);
    }

    .ev__pista {
      max-width: 52ch;
      font-size: 1.3rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoVacio {
  readonly titulo = input.required<string>();
  readonly pista = input('');
}
