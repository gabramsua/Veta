import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { BloqueTexto } from '../../../shared/bloque-texto/bloque-texto';
import { CATEGORIAS_TALLER, CategoriaTaller } from '../../../core/models';
import { CabeceraSeccion } from '../../../shared/cabecera-seccion/cabecera-seccion';
import { PublicoService } from '../../../core/data/publico.service';
import { SeoService } from '../../../core/seo/seo.service';

@Component({
  selector: 'veta-bonos-publico',
  imports: [RouterLink, CabeceraSeccion, BloqueTexto],
  templateUrl: './bonos.html',
  styleUrl: './bonos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bonos {
  private readonly publico = inject(PublicoService);
  private readonly seo = inject(SeoService);

  protected readonly bonos = toSignal(this.publico.bonosActivos(), { initialValue: [] });

  protected nombreCategoria(categoria: CategoriaTaller): string {
    return CATEGORIAS_TALLER[categoria];
  }

  protected porSesion(precioMes: number, sesionesMes: number): string {
    if (sesionesMes <= 0) return '';
    return `${(precioMes / sesionesMes).toFixed(2).replace('.', ',')} € por sesión`;
  }

  constructor() {
    effect(() => {
      this.seo.aplicar({
        titulo: 'Bonos mensuales de talleres · Veta, Sevilla',
        descripcion:
          'Bonos mensuales de cerámica, pintura e infantil en nuestro estudio de Sevilla. Ven cada semana y sale mejor de precio.',
        ruta: '/talleres/bonos',
        imagen: undefined,
      });
      this.seo.datosEstructurados(null);
    });
  }
}
