/**
 * Diagnóstico: muestra el estado real de cada cuenta administradora.
 *
 *   node scripts/ver-admins.mjs
 *
 * Compara las tres fuentes que tienen que estar de acuerdo: el usuario de
 * Authentication, su custom claim `admin` y el documento admins/{uid}.
 * Si el login falla, empieza mirando aquí.
 */

import { existsSync, readFileSync } from 'node:fs';

import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const RUTA_CLAVE = process.env.CLAVE_SERVICIO ?? './clave-servicio.json';

if (!existsSync(RUTA_CLAVE)) {
  console.error(`\n✗ No encuentro ${RUTA_CLAVE}. Mira las instrucciones del README.\n`);
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(RUTA_CLAVE, 'utf8'))) });

const auth = getAuth();
const db = getFirestore();

const { users } = await auth.listUsers(1000);
const documentos = await db.collection('admins').get();
const porUid = new Map(documentos.docs.map((d) => [d.id, d.data()]));

if (users.length === 0) {
  console.log('\n  No hay ningún usuario en Authentication.');
  console.log('  Ejecuta: node scripts/crear-admin.mjs\n');
  process.exit(0);
}

console.log(`\n  ${users.length} usuario(s) en Authentication:\n`);

for (const u of users) {
  const claim = u.customClaims?.admin === true;
  const doc = porUid.get(u.uid);

  console.log(`  ${u.email}`);
  console.log(`    uid ................. ${u.uid}`);
  console.log(`    cuenta habilitada ... ${u.disabled ? 'NO — no puede entrar' : 'sí'}`);
  console.log(`    claim admin ......... ${claim ? 'sí' : 'NO — el guard le echará'}`);
  console.log(`    documento admins/ ... ${doc ? `sí (activo: ${doc.activo})` : 'NO — no saldrá en el listado'}`);

  const problemas = [];
  if (u.disabled) problemas.push('habilita la cuenta');
  if (!claim) problemas.push('falta el claim');
  if (!doc) problemas.push('falta el documento');

  if (problemas.length > 0) {
    console.log(`    → Arréglalo con: node scripts/crear-admin.mjs (${problemas.join(', ')})`);
  }

  console.log('');
}

const huerfanos = documentos.docs.filter((d) => !users.some((u) => u.uid === d.id));

if (huerfanos.length > 0) {
  console.log(`  ⚠ ${huerfanos.length} documento(s) en admins/ sin usuario en Authentication:`);
  for (const d of huerfanos) console.log(`    ${d.id} (${d.data().email})`);
  console.log('');
}
