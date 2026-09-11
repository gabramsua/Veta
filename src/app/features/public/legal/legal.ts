import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { AJUSTES_POR_DEFECTO } from '../../../core/models';
import { AjustesService } from '../../../core/data/ajustes.service';
import { BloqueTexto } from '../../../shared/bloque-texto/bloque-texto';
import { CabeceraSeccion } from '../../../shared/cabecera-seccion/cabecera-seccion';
import { PaginasService } from '../../../core/data/paginas.service';
import { SeoService } from '../../../core/seo/seo.service';
import { textosPorDefecto } from '../../../core/data/textos';
import { tieneContenido } from '../../../core/seo/quitar-html';

export type TipoLegal = 'avisoLegal' | 'privacidad' | 'cookies';

const TITULOS: Record<TipoLegal, { titulo: string; ruta: string }> = {
  avisoLegal: { titulo: 'Aviso legal', ruta: '/aviso-legal' },
  privacidad: { titulo: 'Política de privacidad', ruta: '/politica-de-privacidad' },
  cookies: { titulo: 'Política de cookies', ruta: '/politica-de-cookies' },
};

@Component({
  selector: 'veta-legal',
  imports: [CabeceraSeccion, BloqueTexto],
  templateUrl: './legal.html',
  styleUrl: './legal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Legal {
  // Se fija desde la propia definición de la ruta con `data`.
  readonly tipo = input.required<TipoLegal>();

  // Un texto legal a medio borrar deja `<p><br></p>`, y sin esto la página
  // saldría en blanco en vez de avisar de que falta por redactar.
  protected readonly tieneContenido = tieneContenido;

  private readonly paginas = inject(PaginasService);
  private readonly ajustesService = inject(AjustesService);
  private readonly seo = inject(SeoService);

  private readonly textos = toSignal(this.paginas.textos('legal'), {
    initialValue: textosPorDefecto('legal'),
  });

  protected readonly ajustes = toSignal(this.ajustesService.ajustes$, {
    initialValue: AJUSTES_POR_DEFECTO,
  });

  protected readonly titulo = computed(() => TITULOS[this.tipo()].titulo);
  protected readonly contenido = computed(() => this.textos()[this.tipo()] ?? '');

  constructor() {
    effect(() => {
      this.seo.aplicar({
        titulo: `${this.titulo()} · Veta Estudio Creativo`,
        descripcion: `${this.titulo()} de Veta Estudio Creativo.`,
        ruta: TITULOS[this.tipo()].ruta,
        // Las páginas legales no aportan nada en buscadores y compiten con el
        // contenido real por el presupuesto de rastreo.
        noIndex: true,
      });
      this.seo.datosEstructurados(null);
    });
  }
}
