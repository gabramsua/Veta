import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { REGION, auth, db, exigirAdmin, textoObligatorio } from './comun.js';
import { encolarCorreo } from './emails.js';

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

/**
 * Manda a una administradora un enlace para ponerse una contraseña nueva.
 *
 * Firebase Auth guarda solo un hash scrypt de la contraseña, así que no existe
 * forma de leerla ni de «recordarla»: lo único posible es sustituirla. Se hace
 * con un enlace por correo en vez de generando una contraseña y enseñándola en
 * pantalla, para que nadie tenga que pasarla por un canal inseguro y para que
 * quede en manos de su dueña desde el primer momento.
 *
 * El enlace lo emite Auth, caduca solo y solo sirve una vez.
 */
export const resetPasswordAdmin = onCall<{ uid: string }>({ region: REGION }, async (peticion) => {
  exigirAdmin(peticion);

  const uid = textoObligatorio(peticion.data?.uid, 'uid', 128);

  const perfil = await db.doc(`admins/${uid}`).get();

  if (!perfil.exists) {
    throw new HttpsError('not-found', 'Esa administradora no existe.');
  }

  // El correo se toma de Auth, no del perfil: si alguna vez se separan, el
  // enlace solo es válido para la dirección que Auth reconoce.
  let email: string;
  let nombre: string;

  try {
    const usuario = await auth.getUser(uid);

    if (!usuario.email) {
      throw new HttpsError('failed-precondition', 'Esa cuenta no tiene correo asociado.');
    }

    email = usuario.email;
    nombre = usuario.displayName ?? (perfil.data()?.['nombre'] as string) ?? '';
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('not-found', 'No hemos encontrado esa cuenta.');
  }

  const enlace = await auth.generatePasswordResetLink(email);

  await encolarCorreo(email, 'admin-password', { nombre, enlace });

  return { email };
});
