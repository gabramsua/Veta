import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type SweetAlert = typeof import('sweetalert2').default;

const ESTILOS = {
  confirmButton: 'swal-veta__boton',
  cancelButton: 'swal-veta__boton swal-veta__boton--fantasma',
  popup: 'swal-veta',
  title: 'swal-veta__titulo',
  htmlContainer: 'swal-veta__texto',
};

// SweetAlert2 toca window, así que se carga bajo demanda y solo en navegador.
@Injectable({ providedIn: 'root' })
export class AlertasService {
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  private swal: SweetAlert | null = null;

  private async cargar(): Promise<SweetAlert | null> {
    if (!this.esNavegador) return null;
    this.swal ??= (await import('sweetalert2')).default;
    return this.swal;
  }

  async exito(titulo: string, texto = ''): Promise<void> {
    const swal = await this.cargar();
    await swal?.fire({
      icon: 'success',
      title: titulo,
      text: texto,
      confirmButtonText: 'Entendido',
      customClass: ESTILOS,
      buttonsStyling: false,
    });
  }

  async error(titulo: string, texto = ''): Promise<void> {
    const swal = await this.cargar();
    await swal?.fire({
      icon: 'error',
      title: titulo,
      text: texto,
      confirmButtonText: 'Cerrar',
      customClass: ESTILOS,
      buttonsStyling: false,
    });
  }

  async confirmar(titulo: string, texto: string, textoConfirmar = 'Sí, continuar'): Promise<boolean> {
    const swal = await this.cargar();
    if (!swal) return false;

    const { isConfirmed } = await swal.fire({
      icon: 'warning',
      title: titulo,
      text: texto,
      showCancelButton: true,
      confirmButtonText: textoConfirmar,
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
      customClass: ESTILOS,
      buttonsStyling: false,
    });

    return isConfirmed;
  }

  async aviso(texto: string): Promise<void> {
    const swal = await this.cargar();
    await swal?.fire({
      toast: true,
      position: 'bottom-end',
      icon: 'success',
      title: texto,
      showConfirmButton: false,
      timer: 2600,
      timerProgressBar: true,
      customClass: { popup: 'swal-veta swal-veta--toast' },
    });
  }
}
