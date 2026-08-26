import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { isPlatformServer } from '@angular/common';

import { AJUSTES_POR_DEFECTO, Ajustes } from '../models';
import { leerDocumento } from './lectura-ssr';

const RUTA = 'settings/site';

@Injectable({ providedIn: 'root' })
export class AjustesService {
  private readonly firestore = inject(Firestore);
  private readonly esServidor = isPlatformServer(inject(PLATFORM_ID));

  // Documento único. Si aún no existe, se devuelven los valores por defecto para
  // que la web pública no dependa de que alguien haya entrado al panel.
  readonly ajustes$: Observable<Ajustes> = leerDocumento(
    this.firestore,
    RUTA,
    this.esServidor,
  ).pipe(
    map((datos) => this.fusionar(datos as Partial<Ajustes> | undefined)),
    catchError(() => of(AJUSTES_POR_DEFECTO)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  // Fusión por secciones: si el documento solo trae `redes`, el resto no puede
  // quedarse a undefined o la plantilla reventaría al leerlo.
  private fusionar(datos: Partial<Ajustes> | undefined): Ajustes {
    return {
      secciones: { ...AJUSTES_POR_DEFECTO.secciones, ...(datos?.secciones ?? {}) },
      redes: { ...AJUSTES_POR_DEFECTO.redes, ...(datos?.redes ?? {}) },
      contacto: { ...AJUSTES_POR_DEFECTO.contacto, ...(datos?.contacto ?? {}) },
      avisoGlobal: { ...AJUSTES_POR_DEFECTO.avisoGlobal, ...(datos?.avisoGlobal ?? {}) },
    };
  }

  async guardar(ajustes: Ajustes): Promise<void> {
    await setDoc(doc(this.firestore, RUTA), ajustes, { merge: true });
  }
}
