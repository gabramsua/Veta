import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'veta-panel-seccion',
  template: `
    <header class="ps">
      <div class="ps__texto">
        <h1 class="vt-adm-titulo">{{ titulo() }}</h1>
        @if (descripcion()) {
          <p class="ps__desc">{{ descripcion() }}</p>
        }
      </div>

      @if (accion()) {
        <button type="button" class="vt-adm-boton" (click)="pulsada.emit()">{{ accion() }}</button>
      }
    </header>
  `,
  styles: `
    .ps {
      display: flex;
      flex-wrap: wrap;
      gap: 1.6rem;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2.4rem;
    }

    .ps__desc {
      margin-top: 0.4rem;
      max-width: 62ch;
      color: var(--veta-tinta-suave);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelSeccion {
  readonly titulo = input.required<string>();
  readonly descripcion = input('');
  readonly accion = input('');
  readonly pulsada = output<void>();
}
