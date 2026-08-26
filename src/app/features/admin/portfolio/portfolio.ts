import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { AlertasService } from '../../../core/ui/alertas.service';
import { EstadoVacio } from '../../../shared/estado-vacio/estado-vacio';
import { Ordenar } from '../../../shared/ordenar/ordenar';
import { PanelSeccion } from '../../../shared/panel-seccion/panel-seccion';
import { PiezaPortfolio } from '../../../core/models';
import { PortfolioService } from '../../../core/data/contenido.services';
import { SECCIONES_PORTFOLIO } from '../../../core/data/secciones-portfolio';
import { SelectorMedio } from '../../../shared/selector-medio/selector-medio';
import { siguienteOrden } from '../../../core/data/orden';

@Component({
  selector: 'veta-portfolio',
  imports: [PanelSeccion, EstadoVacio, Ordenar, SelectorMedio],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Portfolio {
  private readonly portfolio = inject(PortfolioService);
  private readonly alertas = inject(AlertasService);

  private readonly selector = viewChild.required(SelectorMedio);

  protected readonly secciones = SECCIONES_PORTFOLIO;

  protected readonly lista = toSignal(
    this.portfolio.listarOrdenado().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly seccionActiva = signal<string>(SECCIONES_PORTFOLIO[0].valor);

  protected readonly deLaSeccion = computed(() =>
    this.lista().filter((p) => p.seccion === this.seccionActiva()),
  );

  protected cuantasEn(seccion: string): number {
    return this.lista().filter((p) => p.seccion === seccion).length;
  }

  protected async anadir(): Promise<void> {
    const imagen = await this.selector().elegir();
    if (!imagen) return;

    await this.portfolio.crear({
      seccion: this.seccionActiva(),
      titulo: imagen.alt,
      imagen,
      orden: siguienteOrden(this.lista()),
      activo: true,
    });

    await this.alertas.aviso('Imagen añadida al portfolio');
  }

  protected async guardarTitulo(pieza: PiezaPortfolio, evento: Event): Promise<void> {
    const titulo = (evento.target as HTMLInputElement).value.trim();
    if (titulo === pieza.titulo) return;

    await this.portfolio.actualizar(pieza.id, { titulo });
  }

  // El orden se calcula sobre la lista completa para no descolocar las demás
  // secciones al reordenar dentro de una.
  protected async mover(pieza: PiezaPortfolio, direccion: -1 | 1): Promise<void> {
    const enSeccion = this.deLaSeccion();
    const indiceLocal = enSeccion.findIndex((p) => p.id === pieza.id);
    const vecino = enSeccion[indiceLocal + direccion];

    if (!vecino) return;

    await this.portfolio.actualizar(pieza.id, { orden: vecino.orden });
    await this.portfolio.actualizar(vecino.id, { orden: pieza.orden });
  }

  protected esPrimera(pieza: PiezaPortfolio): boolean {
    return this.deLaSeccion()[0]?.id === pieza.id;
  }

  protected esUltima(pieza: PiezaPortfolio): boolean {
    const lista = this.deLaSeccion();
    return lista[lista.length - 1]?.id === pieza.id;
  }

  protected async alternarActivo(pieza: PiezaPortfolio): Promise<void> {
    await this.portfolio.actualizar(pieza.id, { activo: !pieza.activo });
  }

  protected async quitar(pieza: PiezaPortfolio): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      '¿Quitar esta imagen del portfolio?',
      'La imagen sigue en la biblioteca de medios: solo deja de verse en esta sección.',
      'Sí, quitar',
    );

    if (!confirmado) return;

    await this.portfolio.borrar(pieza.id);
    await this.alertas.aviso('Imagen quitada del portfolio');
  }
}
