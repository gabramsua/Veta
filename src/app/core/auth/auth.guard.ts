import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

import { AuthService } from './auth.service';

// Espera a que Firebase resuelva el estado inicial antes de decidir. Sin esto,
// recargar dentro del panel expulsa al login aunque haya sesión válida.
export const authGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.cargando).pipe(
    filter((cargando) => !cargando),
    take(1),
    map(() =>
      auth.autenticada()
        ? true
        : router.createUrlTree(['/acceso'], { queryParams: { volver: estado.url } }),
    ),
  );
};

export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.cargando).pipe(
    filter((cargando) => !cargando),
    take(1),
    map(() => (auth.autenticada() ? router.createUrlTree(['/panel/inicio']) : true)),
  );
};
