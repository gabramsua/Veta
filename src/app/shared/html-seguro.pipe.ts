import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Solo para HTML escrito por una administradora autenticada a través de Jodit.
// Nunca para contenido que venga de un formulario público.
@Pipe({ name: 'htmlSeguro' })
export class HtmlSeguroPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(html: string | null | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html ?? '');
  }
}
