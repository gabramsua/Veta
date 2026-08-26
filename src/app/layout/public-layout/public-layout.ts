import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { AJUSTES_POR_DEFECTO } from '../../core/models';
import { AjustesService } from '../../core/data/ajustes.service';
import { navegacionVisible } from '../../core/data/navegacion-publica';

@Component({
  selector: 'veta-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayout {
  private readonly ajustesService = inject(AjustesService);

  protected readonly ajustes = toSignal(this.ajustesService.ajustes$, {
    initialValue: AJUSTES_POR_DEFECTO,
  });

  protected readonly enlaces = computed(() => navegacionVisible(this.ajustes().secciones));
  protected readonly anio = new Date().getFullYear();

  protected readonly redes = computed(() => {
    const r = this.ajustes().redes;

    return [
      { nombre: 'Instagram', url: r.instagram },
      { nombre: 'Pinterest', url: r.pinterest },
      { nombre: 'Facebook', url: r.facebook },
      { nombre: 'TikTok', url: r.tiktok },
    ].filter((red) => red.url.trim().length > 0);
  });

  protected readonly menuAbierto = signal(false);
  protected readonly submenuAbierto = signal<string | null>(null);
  protected readonly cabeceraCompacta = signal(false);
  protected readonly avisoCerrado = signal(false);

  protected readonly mostrarAviso = computed(
    () => this.ajustes().avisoGlobal.activo && !this.avisoCerrado(),
  );

  @HostListener('window:scroll')
  protected alHacerScroll(): void {
    this.cabeceraCompacta.set(window.scrollY > 40);
  }

  protected alternarMenu(): void {
    this.menuAbierto.update((v) => !v);
    this.submenuAbierto.set(null);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
    this.submenuAbierto.set(null);
  }

  protected alternarSubmenu(etiqueta: string, evento: Event): void {
    evento.preventDefault();
    this.submenuAbierto.update((actual) => (actual === etiqueta ? null : etiqueta));
  }

  protected cerrarAviso(): void {
    this.avisoCerrado.set(true);
  }
}
