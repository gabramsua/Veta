import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const CLAVE = 'veta:instagram';

/**
 * Si la visitante ya ha dejado cargar vídeos de Instagram.
 *
 * Esto es consentimiento por elemento, no un banner de toda la web, y es lo que
 * permite tener las dos cosas a la vez: nada de Meta hasta que alguien lo pide,
 * y vídeos que se reproducen sin botón para quien ya dijo que sí.
 *
 * El primer clic en un vídeo es el consentimiento. A partir de ahí, el resto de
 * vídeos de esa página y de las siguientes visitas cargan solos. Es válido
 * porque es un acto afirmativo, informado —la tarjeta dice lo que va a pasar— y
 * revocable desde el propio bloque de vídeos.
 *
 * Un banner de sitio haría lo mismo, pero se lo enseñaría a todo el mundo en
 * cada primera visita, incluida la gente que nunca entra en live art. Cambiar
 * un clic de quien quiere ver un vídeo por una ventana para todos es mal trato.
 *
 * En servidor siempre responde que no: no hay `localStorage`, y renderizar el
 * marco de Instagram en el HTML que sirve el servidor cargaría Meta antes de
 * que el navegador pueda comprobar nada.
 */
@Injectable({ providedIn: 'root' })
export class ConsentimientoInstagram {
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly estado = signal(this.leer());

  readonly concedido = this.estado.asReadonly();

  conceder(): void {
    this.estado.set(true);
    this.guardar('si');
  }

  revocar(): void {
    this.estado.set(false);
    this.guardar(null);
  }

  private leer(): boolean {
    if (!this.esNavegador) return false;

    try {
      return localStorage.getItem(CLAVE) === 'si';
    } catch {
      // Modo privado o almacenamiento bloqueado: se trata como un «no».
      return false;
    }
  }

  private guardar(valor: string | null): void {
    if (!this.esNavegador) return;

    try {
      if (valor === null) localStorage.removeItem(CLAVE);
      else localStorage.setItem(CLAVE, valor);
    } catch {
      // Sin almacenamiento la decisión vale solo para esta página. Que no
      // recuerde es preferible a que reviente.
    }
  }
}
