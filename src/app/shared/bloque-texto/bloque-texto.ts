import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { HtmlSeguroPipe } from '../html-seguro.pipe';

// Pinta el HTML que ha escrito una administradora desde Jodit. Nunca se usa con
// contenido que venga de un formulario público.
@Component({
  selector: 'veta-bloque-texto',
  imports: [HtmlSeguroPipe],
  template: `
    @if (html()) {
      <div class="bt" [innerHTML]="html() | htmlSeguro"></div>
    }
  `,
  styles: `
    .bt {
      max-width: var(--ancho-texto);
      font-size: var(--txt-md);
      color: var(--veta-tinta-suave);
    }

    .bt :is(p, ul, ol) {
      margin-bottom: 1.6rem;
    }

    .bt :is(h2, h3) {
      margin-block: 3.2rem 1.2rem;
      font-family: var(--fuente-titular);
      font-size: var(--txt-lg);
      color: var(--veta-tinta);
    }

    .bt a {
      color: var(--veta-terracota);
      text-decoration: underline;
    }

    .bt :is(ul, ol) {
      padding-left: 2.4rem;
    }

    .bt strong {
      color: var(--veta-tinta);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BloqueTexto {
  readonly html = input<string>('');
}
