import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';

import { DialogoService } from '../dialogo/dialogo';
import { PiezaPortfolio } from '../../core/models';

@Component({
  selector: 'veta-galeria',
  templateUrl: './galeria.html',
  styleUrl: './galeria.scss',
  providers: [DialogoService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Galeria {
  readonly piezas = input.required<PiezaPortfolio[]>();

  private readonly dialogo = inject(DialogoService);

  protected readonly ampliada = signal<PiezaPortfolio | null>(null);

  protected ampliar(pieza: PiezaPortfolio): void {
    this.ampliada.set(pieza);
    this.dialogo.abrir(() => this.ampliada.set(null));
  }

  protected cerrar(): void {
    this.ampliada.set(null);
    this.dialogo.cerrar();
  }
}
