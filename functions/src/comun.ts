import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

initializeApp();

export const db = getFirestore();
export const auth = getAuth();

export const REGION = 'europe-west1';

export function exigirAdmin(peticion: CallableRequest<unknown>): string {
  const uid = peticion.auth?.uid;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'Hay que iniciar sesión.');
  }

  if (peticion.auth?.token['admin'] !== true) {
    throw new HttpsError('permission-denied', 'Esta cuenta no tiene permisos de administración.');
  }

  return uid;
}

export function textoObligatorio(valor: unknown, campo: string, maxLong: number): string {
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    throw new HttpsError('invalid-argument', `El campo ${campo} es obligatorio.`);
  }

  const limpio = valor.trim();

  if (limpio.length > maxLong) {
    throw new HttpsError('invalid-argument', `El campo ${campo} es demasiado largo.`);
  }

  return limpio;
}
