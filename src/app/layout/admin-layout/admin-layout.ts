import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AlertasService } from '../../core/ui/alertas.service';
import { AuthService } from '../../core/auth/auth.service';
import { NAV_PANEL } from '../../core/data/navegacion';

@Component({
  selector: 'veta-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
  private readonly auth = inject(AuthService);
  private readonly alertas = inject(AlertasService);
  private readonly router = inject(Router);

  protected readonly grupos = NAV_PANEL;
  protected readonly sesion = this.auth.sesion;

  protected readonly barraAbierta = signal(false);
  protected readonly grupoAbierto = signal<string | null>('La web');

  protected alternarBarra(): void {
    this.barraAbierta.update((v) => !v);
  }

  protected cerrarBarra(): void {
    this.barraAbierta.set(false);
  }

  protected alternarGrupo(etiqueta: string): void {
    this.grupoAbierto.update((actual) => (actual === etiqueta ? null : etiqueta));
  }

  protected async salir(): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      '¿Cerrar sesión?',
      'Tendrás que volver a introducir tu correo y contraseña.',
      'Sí, salir',
    );

    if (!confirmado) return;

    await this.auth.salir();
    await this.router.navigate(['/acceso']);
  }
}
