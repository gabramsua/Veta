import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { AJUSTES_POR_DEFECTO, CATEGORIAS_TALLER, CategoriaTaller } from '../../../core/models';
import { AjustesService } from '../../../core/data/ajustes.service';
import { BloqueTexto } from '../../../shared/bloque-texto/bloque-texto';
import { CabeceraSeccion } from '../../../shared/cabecera-seccion/cabecera-seccion';
import { PaginasService } from '../../../core/data/paginas.service';
import { PublicoService } from '../../../core/data/publico.service';
import { SeoService } from '../../../core/seo/seo.service';
import { formatearFecha } from '../../../core/data/fechas';
import { textoPlano, tieneContenido } from '../../../core/seo/quitar-html';
import { textosPorDefecto } from '../../../core/data/textos';

const SLUG = 'talleres';

@Component({
  selector: 'veta-talleres-publico',
  imports: [RouterLink, CabeceraSeccion, BloqueTexto],
  templateUrl: './talleres.html',
  styleUrl: './talleres.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Talleres {
  // Jodit deja `<p><br></p>` al vaciar un campo, así que comprobar la cadena a
  // secas dejaría la sección en pie con todo su espaciado y nada dentro.
  protected readonly tieneContenido = tieneContenido;

  private readonly paginas = inject(PaginasService);
  private readonly publico = inject(PublicoService);
  private readonly seo = inject(SeoService);
  private readonly ajustesService = inject(AjustesService);

  protected readonly formatearFecha = formatearFecha;

  protected readonly textos = toSignal(this.paginas.textos(SLUG), {
    initialValue: textosPorDefecto(SLUG),
  });

  protected readonly ajustes = toSignal(this.ajustesService.ajustes$, {
    initialValue: AJUSTES_POR_DEFECTO,
  });

  protected readonly talleres = toSignal(this.publico.talleresActivos(), { initialValue: [] });
  protected readonly sesiones = toSignal(this.publico.proximasSesiones(), { initialValue: [] });

  private readonly seoPagina = toSignal(this.paginas.seo(SLUG), {
    initialValue: { title: '', description: '', ogImage: '' },
  });

  // Los eventos privados no tienen fechas fijas: se piden por presupuesto.
  protected readonly conCalendario = computed(() =>
    this.talleres().filter((t) => t.categoria !== 'eventos'),
  );

  protected readonly aMedida = computed(() =>
    this.talleres().filter((t) => t.categoria === 'eventos'),
  );

  protected sesionesDe(workshopId: string) {
    return this.sesiones().filter((s) => s.sesion.workshopId === workshopId);
  }

  protected nombreCategoria(categoria: CategoriaTaller): string {
    return CATEGORIAS_TALLER[categoria];
  }

  constructor() {
    effect(() => {
      const propio = this.seoPagina();
      const t = this.textos();

      this.seo.aplicar({
        titulo: propio.title || 'Talleres de cerámica, pintura e infantiles · Veta, Sevilla',
        descripcion:
          propio.description ||
          textoPlano(t['entradilla'] || '') ||
          'Talleres presenciales de cerámica, pintura e infantiles en nuestro estudio de Sevilla.',
        ruta: '/talleres',
        imagen: propio.ogImage || this.talleres()[0]?.imagenes[0]?.url,
      });

      // Un Event por sesión: es lo que Google usa para las fichas de eventos.
      const eventos = this.sesiones()
        .slice(0, 20)
        .map((item) =>
          this.seo.eventoTaller({
            nombre: item.taller.titulo,
            descripcion: textoPlano(item.taller.descripcion, 300),
            inicio: item.sesion.fechaInicio.toDate(),
            fin: item.sesion.fechaFin.toDate(),
            precio: item.taller.precio,
            plazasLibres: item.plazasLibres,
            ruta: '/talleres',
          }),
        );

      this.seo.datosEstructurados(eventos.length > 0 ? eventos : null);
    });
  }
}
