import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Firestore, Timestamp, orderBy } from '@angular/fire/firestore';
import { Observable, catchError, map, of } from 'rxjs';
import { isPlatformServer } from '@angular/common';

import { ColeccionBase } from './firestore-base';
import { Vacaciones } from '../models';
import { leerDocumento } from './lectura-ssr';

const UN_DIA = 24 * 60 * 60 * 1000;

/** Lo mínimo que la web pública necesita saber de un periodo cerrado. */
export interface Cierre {
  fechaInicio: Timestamp;
  fechaFin: Timestamp;
  workshopIds: string[];
}

@Injectable({ providedIn: 'root' })
export class VacacionesService extends ColeccionBase<Vacaciones> {
  protected readonly ruta = 'vacations';

  listarPorFecha(): Observable<Vacaciones[]> {
    return this.listar(orderBy('fechaInicio'));
  }
}

/**
 * `vacations` solo lo pueden leer las administradoras: lleva quién ha cogido
 * cada periodo y notas internas. La web pública lee `settings/cierres`, un
 * espejo con solo fechas y talleres afectados que mantiene una Function.
 */
@Injectable({ providedIn: 'root' })
export class CierresService {
  private readonly firestore = inject(Firestore);
  private readonly esServidor = isPlatformServer(inject(PLATFORM_ID));

  listar(): Observable<Cierre[]> {
    return leerDocumento(this.firestore, 'settings/cierres', this.esServidor).pipe(
      map((datos) => (datos?.['periodos'] ?? []) as Cierre[]),
      catchError(() => of([] as Cierre[])),
    );
  }
}

// Se cuentan días naturales, extremos incluidos. Si algún día hay que descontar
// fines de semana o festivos, es aquí (ver P9 en pendientes.md).
export function diasDelPeriodo(inicio: Timestamp, fin: Timestamp): number {
  const desde = new Date(inicio.toDate().setHours(0, 0, 0, 0));
  const hasta = new Date(fin.toDate().setHours(0, 0, 0, 0));

  return Math.max(0, Math.round((hasta.getTime() - desde.getTime()) / UN_DIA) + 1);
}

export function diasConsumidos(periodos: Vacaciones[], adminUid: string, anio: number): number {
  return periodos
    .filter((p) => p.adminUid === adminUid && p.fechaInicio.toDate().getFullYear() === anio)
    .reduce((total, p) => total + diasDelPeriodo(p.fechaInicio, p.fechaFin), 0);
}

/**
 * Un periodo bloquea una fecha si se solapa con ella y afecta a ese taller.
 * `workshopIds` vacío significa «todo el estudio cierra».
 */
export function estaBloqueado<T extends Cierre>(
  periodos: T[],
  workshopId: string,
  inicio: Timestamp,
  fin: Timestamp,
): T | null {
  return (
    periodos.find((periodo) => {
      const afecta = periodo.workshopIds.length === 0 || periodo.workshopIds.includes(workshopId);
      if (!afecta) return false;

      const desde = new Date(periodo.fechaInicio.toDate().setHours(0, 0, 0, 0)).getTime();
      const hasta = new Date(periodo.fechaFin.toDate().setHours(23, 59, 59, 999)).getTime();

      return inicio.toMillis() <= hasta && desde <= fin.toMillis();
    }) ?? null
  );
}
