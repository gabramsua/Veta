/**
 * Crea (o repara) la primera cuenta de administradora.
 *
 *   node scripts/crear-admin.mjs
 *
 * Es idempotente: si el usuario ya existe en Authentication, no lo duplica.
 * Se limita a asegurar el custom claim `admin` y el documento `admins/{uid}`.
 *
 * Necesita una clave de cuenta de servicio. Cómo obtenerla:
 *   Consola de Firebase → ⚙ Configuración del proyecto → Cuentas de servicio
 *   → «Generar nueva clave privada» → guarda el JSON como `clave-servicio.json`
 *   en la raíz del proyecto.
 *
 * BORRA ESE FICHERO al terminar. Da acceso total al proyecto.
 * Ya está en .gitignore, pero no lo dejes rondando por el disco.
 */

import { existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const RUTA_CLAVE = process.env.CLAVE_SERVICIO ?? './clave-servicio.json';

const rl = createInterface({ input: stdin, output: stdout });

function salir(mensaje) {
  console.error(`\n✗ ${mensaje}\n`);
  rl.close();
  process.exit(1);
}

async function preguntar(etiqueta, validar) {
  for (;;) {
    const valor = (await rl.question(etiqueta)).trim();
    const problema = validar(valor);
    if (!problema) return valor;
    console.log(`  ↳ ${problema}`);
  }
}

if (!existsSync(RUTA_CLAVE)) {
  salir(
    `No encuentro ${RUTA_CLAVE}.\n` +
      '  Descárgala en: Consola de Firebase → Configuración del proyecto →\n' +
      '  Cuentas de servicio → Generar nueva clave privada.\n' +
      '  Guárdala en la raíz del proyecto como clave-servicio.json',
  );
}

const clave = JSON.parse(readFileSync(RUTA_CLAVE, 'utf8'));

if (clave.project_id !== 'veta-estudio-creativo') {
  salir(
    `Esa clave es del proyecto "${clave.project_id}", no de veta-estudio-creativo.\n` +
      '  Descarga la clave desde el proyecto correcto.',
  );
}

initializeApp({ credential: cert(clave) });

const auth = getAuth();
const db = getFirestore();

console.log('\n  Alta de administradora · Veta\n');

const nombre = await preguntar('  Nombre: ', (v) =>
  v.length === 0 ? 'El nombre no puede estar vacío.' : null,
);

const email = await preguntar('  Correo: ', (v) =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? null : 'Ese correo no tiene formato válido.',
);

let usuario = await auth.getUserByEmail(email).catch(() => null);
let creado = false;

if (usuario) {
  console.log(`\n  Ese correo ya existe en Authentication (uid ${usuario.uid}).`);
  console.log('  No lo toco. Solo me aseguro del permiso y del documento.\n');
} else {
  const password = await preguntar('  Contraseña (mínimo 8 caracteres): ', (v) =>
    v.length < 8 ? 'Necesita al menos 8 caracteres.' : null,
  );

  usuario = await auth.createUser({ email, password, displayName: nombre });
  creado = true;
  console.log(`\n  ✓ Usuario creado (uid ${usuario.uid})`);
}

await auth.setCustomUserClaims(usuario.uid, { admin: true });
console.log('  ✓ Permiso de administradora asignado');

const documento = db.doc(`admins/${usuario.uid}`);
const actual = await documento.get();

await documento.set(
  {
    nombre,
    email,
    rol: 'admin',
    activo: true,
    diasVacaciones: actual.exists ? (actual.data().diasVacaciones ?? 0) : 0,
    createdAt: actual.exists ? actual.data().createdAt : FieldValue.serverTimestamp(),
  },
  { merge: true },
);

console.log(`  ✓ Documento admins/${usuario.uid} ${actual.exists ? 'actualizado' : 'creado'}`);

console.log('\n  Listo. Entra en http://localhost:4200/acceso con ese correo.');

if (creado) {
  console.log('\n  Recuerda:');
  console.log('  · Borra clave-servicio.json cuando termines.');
} else {
  console.log('\n  Nota: como el usuario ya existía, la contraseña sigue siendo la de antes.');
  console.log('  Si no la recuerdas, ejecuta: node scripts/reset-password.mjs');
}

console.log('');
rl.close();
