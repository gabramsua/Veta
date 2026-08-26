import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/**
 * Comportamiento común de los diálogos a pantalla completa.
 *
 * Tres cosas que un `<div role="dialog">` no trae de serie y que sin ellas el
 * diálogo es inservible con teclado:
 *
 * 1. Cerrar con Escape.
 * 2. Devolver el foco al elemento que lo abrió.
 * 3. Bloquear el scroll del fondo mientras está abierto.
 */
@Injectable()
export class DialogoService {
  private readonly documento = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private elementoPrevio: HTMLElement | null = null;
  private alEscape: (() => void) | null = null;
  private escuchando = false;

  readonly abierto = signal(false);

  constructor() {
    this.destroyRef.onDestroy(() => this.cerrar());
  }

  abrir(alCerrar: () => void): void {
    this.elementoPrevio = this.documento.activeElement as HTMLElement | null;
    this.alEscape = alCerrar;
    this.abierto.set(true);

    this.documento.body.style.overflow = 'hidden';

    if (!this.escuchando) {
      this.documento.addEventListener('keydown', this.escuchar);
      this.escuchando = true;
    }
  }

  cerrar(): void {
    if (!this.abierto()) return;

    this.abierto.set(false);
    this.documento.body.style.overflow = '';

    if (this.escuchando) {
      this.documento.removeEventListener('keydown', this.escuchar);
      this.escuchando = false;
    }

    this.elementoPrevio?.focus?.();
    this.elementoPrevio = null;
    this.alEscape = null;
  }

  private readonly escuchar = (evento: KeyboardEvent): void => {
    if (evento.key !== 'Escape') return;

    evento.preventDefault();
    const cerrar = this.alEscape;
    this.cerrar();
    cerrar?.();
  };
}
