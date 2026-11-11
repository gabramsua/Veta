import { ChangeDetectionStrategy, Component, HostListener, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

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
  private readonly router = inject(Router);
  private readonly documento = inject(DOCUMENT);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

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

  constructor() {
    this.router.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.alNavegar());
  }

  /**
   * Cierra el menú al cambiar de página.
   *
   * El desplegable de escritorio se abre con `:hover` y con `:focus-within`, y
   * el foco es el que lo dejaba abierto: al pulsar un enlace el navegador se lo
   * queda, la navegación no se lo quita, y el submenú seguía visible aunque el
   * ratón se hubiera ido a otra parte.
   *
   * Por eso se quita el foco a mano, y solo si está dentro de la navegación:
   * quitárselo a cualquier otra cosa sería robárselo a quien esté usando la
   * página con el teclado.
   */
  private alNavegar(): void {
    this.cerrarMenu();

    if (!this.esNavegador) return;

    const activo = this.documento.activeElement;

    if (activo instanceof HTMLElement && activo.closest('.cab__nav')) {
      activo.blur();
    }
  }

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
