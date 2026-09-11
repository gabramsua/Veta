import { Directive, computed, input } from '@angular/core';

import { EstiloTexto } from '../../core/data/textos';

const CLASES: Record<EstiloTexto, string> = {
  titular: 'vt-fuente-titular',
  cuerpo: 'vt-fuente-cuerpo',
  eslogan: 'vt-eslogan',
};

/**
 * Pinta un texto con la familia tipográfica que se haya elegido en el panel.
 *
 * Se resuelve con una clase y no con un `style` en línea para que el tamaño y
 * los ajustes finos de cada familia —la inglesa necesita más interlínea— vivan
 * en la hoja de estilos y no repartidos por las plantillas.
 *
 * Si el estilo no llega o no se reconoce, no se añade nada y manda el CSS de
 * siempre. Una página nunca se queda sin fuente por esto.
 */
@Directive({
  selector: '[vetaFuente]',
  host: { '[class]': 'clase()' },
})
export class Fuente {
  readonly vetaFuente = input<EstiloTexto | undefined>();

  protected readonly clase = computed(() => {
    const estilo = this.vetaFuente();
    return estilo ? (CLASES[estilo] ?? '') : '';
  });
}
