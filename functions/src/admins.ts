import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { REGION, auth, db, exigirAdmin, textoObligatorio } from './comun.js';

interface AltaAdmin {
  nombre: string;
  email: string;
  password: string;
}

// Crear un usuario y asignarle el claim `admin` exige Admin SDK, así que no
// puede hacerse desde el cliente.
export const createAdminUser = onCall<AltaAdmin>({ region: REGION }, async (peticion) => {
  exigirAdmin(peticion);

  const nombre = textoObligatorio(peticion.data?.nombre, 'nombre', 80);
  const email = textoObligatorio(peticion.data?.email, 'email', 200).toLowerCase();
  const password = textoObligatorio(peticion.data?.password, 'contraseña', 128);

  if (password.length < 8) {
    throw new HttpsError('invalid-argument', 'La contraseña necesita al menos 8 caracteres.');
  }

  let uid: string;

  try {
    const usuario = await auth.createUser({ email, password, displayName: nombre });
    uid = usuario.uid;
  } catch (error) {
    const codigo = (error as { code?: string }).code;

    if (codigo === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Ya hay una cuenta con ese correo.');
    }

    throw new HttpsError('internal', 'No hemos podido crear la cuenta.');
  }

  await auth.setCustomUserClaims(uid, { admin: true });

  await db.doc(`admins/${uid}`).set({
    nombre,
    email,
    rol: 'admin',
    activo: true,
    diasVacaciones: 0,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { uid };
});

// Desactivar cierra el acceso pero no borra nada de lo que haya creado.
export const setAdminEnabled = onCall<{ uid: string; activo: boolean }>(
  { region: REGION },
  async (peticion) => {
    const quienLlama = exigirAdmin(peticion);
    const uid = textoObligatorio(peticion.data?.uid, 'uid', 128);
    const activo = peticion.data?.activo === true;

    if (uid === quienLlama) {
      throw new HttpsError('failed-precondition', 'No puedes cambiar tu propio estado.');
    }

    const documento = await db.doc(`admins/${uid}`).get();

    if (!documento.exists) {
      throw new HttpsError('not-found', 'Esa administradora no existe.');
    }

    await auth.updateUser(uid, { disabled: !activo });
    await auth.setCustomUserClaims(uid, activo ? { admin: true } : {});
    await db.doc(`admins/${uid}`).update({ activo });

    // Invalida los tokens vigentes: sin esto seguiría dentro hasta una hora.
    await auth.revokeRefreshTokens(uid);

    return { ok: true };
  },
);
