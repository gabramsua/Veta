import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { CabeceraSeccion } from '../../../shared/cabecera-seccion/cabecera-seccion';
import { HtmlSeguroPipe } from '../../../shared/html-seguro.pipe';
import { PublicoService } from '../../../core/data/publico.service';
import { SeoService } from '../../../core/seo/seo.service';
import { textoPlano } from '../../../core/seo/quitar-html';

@Component({
  selector: 'veta-faq',
  imports: [CabeceraSeccion, HtmlSeguroPipe],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Faq {
  private readonly publico = inject(PublicoService);
  private readonly seo = inject(SeoService);

  protected readonly preguntas = toSignal(this.publico.faqsActivas(), { initialValue: [] });
  protected readonly abierta = signal<string | null>(null);

  // Si nadie ha puesto categoría, no se muestran encabezados de grupo.
  protected readonly grupos = computed(() => {
    const preguntas = this.preguntas();
    const categorias = [...new Set(preguntas.map((p) => p.categoria).filter(Boolean))];

    if (categorias.length === 0) {
      return [{ categoria: '', preguntas }];
    }

    const grupos = categorias.map((categoria) => ({
      categoria,
      preguntas: preguntas.filter((p) => p.categoria === categoria),
    }));

    const sinCategoria = preguntas.filter((p) => !p.categoria);
    if (sinCategoria.length > 0) grupos.push({ categoria: 'Otras', preguntas: sinCategoria });

    return grupos;
  });

  protected alternar(id: string): void {
    this.abierta.update((actual) => (actual === id ? null : id));
  }

  constructor() {
    effect(() => {
      const preguntas = this.preguntas();

      this.seo.aplicar({
        titulo: 'Preguntas frecuentes · Veta Estudio Creativo',
        descripcion:
          'Resolvemos las dudas más habituales sobre papelería de bodas, talleres, encargos y reservas.',
        ruta: '/preguntas-frecuentes',
      });

      // FAQPage permite que Google muestre las preguntas desplegables en el
      // propio resultado de búsqueda.
      this.seo.datosEstructurados(
        preguntas.length > 0
          ? {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: preguntas.map((p) => ({
                '@type': 'Question',
                name: p.pregunta,
                acceptedAnswer: { '@type': 'Answer', text: textoPlano(p.respuesta, 1200) },
              })),
            }
          : null,
      );
    });
  }
}
