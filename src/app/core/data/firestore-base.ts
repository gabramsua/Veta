import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import {
  CollectionReference,
  DocumentData,
  Firestore,
  QueryConstraint,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  query,
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';

// Base tipada para las colecciones. Los componentes no tocan Firestore: usan
// los servicios que extienden esta clase.
@Injectable()
export abstract class ColeccionBase<T extends { id: string }> {
  protected readonly firestore = inject(Firestore);
  protected readonly esServidor = isPlatformServer(inject(PLATFORM_ID));
  protected abstract readonly ruta: string;

  protected get coleccion(): CollectionReference<DocumentData> {
    return collection(this.firestore, this.ruta);
  }

  /**
   * En navegador devuelve un listener, para que la pantalla se actualice sola.
   * En servidor, una lectura suelta: un listener abierto impide que Angular dé
   * por terminado el renderizado, y la petición se queda colgada. Ver
   * `lectura-ssr.ts` para la explicación completa.
   */
  listar(...restricciones: QueryConstraint[]): Observable<T[]> {
    const consulta = query(this.coleccion, ...restricciones);

    if (this.esServidor) {
      return from(getDocs(consulta)).pipe(
        map((instantanea) =>
          instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }) as T),
        ),
      );
    }

    return collectionData(consulta, { idField: 'id' }) as Observable<T[]>;
  }

  obtener(id: string): Observable<T | undefined> {
    const referencia = doc(this.firestore, this.ruta, id);

    if (this.esServidor) {
      return from(getDoc(referencia)).pipe(
        map((instantanea) =>
          instantanea.exists() ? ({ id: instantanea.id, ...instantanea.data() } as T) : undefined,
        ),
      );
    }

    return docData(referencia, { idField: 'id' }) as Observable<T | undefined>;
  }

  async crear(datos: Omit<T, 'id'>): Promise<string> {
    const referencia = await addDoc(this.coleccion, {
      ...datos,
      createdAt: serverTimestamp(),
    });
    return referencia.id;
  }

  async crearConId(id: string, datos: Omit<T, 'id'>): Promise<void> {
    await setDoc(doc(this.firestore, this.ruta, id), { ...datos });
  }

  async actualizar(id: string, cambios: Partial<Omit<T, 'id'>>): Promise<void> {
    await updateDoc(doc(this.firestore, this.ruta, id), cambios as DocumentData);
  }

  async borrar(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, this.ruta, id));
  }
}
