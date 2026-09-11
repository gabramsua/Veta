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

  /**
   * Pide elegir una opción de una lista corta. Devuelve `null` si se cancela.
   *
   * Se usa radio y no un desplegable porque las opciones son pocas y así se ven
   * todas de golpe, sin tener que desplegar nada.
   */
  async elegirOpcion(
    titulo: string,
    opciones: { valor: string; etiqueta: string }[],
    porDefecto = opciones[0]?.valor ?? '',
  ): Promise<string | null> {
    const swal = await this.cargar();
    if (!swal) return null;

    const { isConfirmed, value } = await swal.fire({
      title: titulo,
      input: 'radio',
      inputOptions: Object.fromEntries(opciones.map((o) => [o.valor, o.etiqueta])),
      inputValue: porDefecto,
      showCancelButton: true,
      confirmButtonText: 'Insertar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: ESTILOS,
      buttonsStyling: false,
    });

    return isConfirmed && typeof value === 'string' ? value : null;
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
