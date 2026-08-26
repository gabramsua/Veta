import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Auth,
  User,
  browserLocalPersistence,
  browserSessionPersistence,
  onIdTokenChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';

export interface SesionAdmin {
  uid: string;
  email: string;
  nombre: string;
  esAdmin: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);

  private readonly _sesion = signal<SesionAdmin | null>(null);
  private readonly _cargando = signal(true);

  readonly sesion = this._sesion.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly autenticada = computed(() => this._sesion()?.esAdmin === true);

  constructor() {
    onIdTokenChanged(this.auth, async (user) => {
      this._sesion.set(user ? await this.construirSesion(user) : null);
      this._cargando.set(false);
    });
  }

  async entrar(email: string, password: string, recordar: boolean): Promise<SesionAdmin> {
    await setPersistence(
      this.auth,
      recordar ? browserLocalPersistence : browserSessionPersistence,
    );

    const credencial = await signInWithEmailAndPassword(this.auth, email, password);
    const sesion = await this.construirSesion(credencial.user, true);

    if (!sesion.esAdmin) {
      await signOut(this.auth);
      throw new Error('sin-permisos');
    }

    this._sesion.set(sesion);
    return sesion;
  }

  async salir(): Promise<void> {
    await signOut(this.auth);
    this._sesion.set(null);
  }

  // El claim `admin` lo asigna la Function createAdminUser. Se refresca al entrar
  // para que un alta reciente no obligue a cerrar sesión.
  private async construirSesion(user: User, forzarRefresco = false): Promise<SesionAdmin> {
    const token = await user.getIdTokenResult(forzarRefresco);

    return {
      uid: user.uid,
      email: user.email ?? '',
      nombre: user.displayName || (user.email ?? '').split('@')[0],
      esAdmin: token.claims['admin'] === true,
    };
  }
}
