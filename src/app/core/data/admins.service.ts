import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { Admin } from '../models';
import { ColeccionBase } from './firestore-base';

export interface AltaAdmin {
  nombre: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AdminsService extends ColeccionBase<Admin> {
  protected readonly ruta = 'admins';
  private readonly functions = inject(Functions);

  listarOrdenados(): Observable<Admin[]> {
    return this.listar(orderBy('nombre'));
  }

  // Crear el usuario y asignar el claim exige Admin SDK: va por Function.
  async invitar(datos: AltaAdmin): Promise<void> {
    const fn = httpsCallable<AltaAdmin, { uid: string }>(this.functions, 'createAdminUser');
    await fn(datos);
  }

  async cambiarEstado(id: string, activo: boolean): Promise<void> {
    const fn = httpsCallable<{ uid: string; activo: boolean }, void>(
      this.functions,
      'setAdminEnabled',
    );
    await fn({ uid: id, activo });
  }
}
