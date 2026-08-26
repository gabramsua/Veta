/**
 * Diagnóstico de la cola de correo.
 *
 *   npm run correo:ver
 *
 * La Function `enviarCorreo` escribe el resultado de cada envío en el propio
 * documento, dentro de `delivery`. Si un correo no llega, la razón está ahí.
 */

import { existsSync, readFileSync } from 'node:fs';

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const RUTA_CLAVE = process.env.CLAVE_SERVICIO ?? './clave-servicio.json';

if (!existsSync(RUTA_CLAVE)) {
  console.error(`\n✗ No encuentro ${RUTA_CLAVE}.\n`);
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(RUTA_CLAVE, 'utf8'))) });

const cola = await getFirestore()
  .collection('mail')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get();

if (cola.empty) {
  console.log('\n  La cola está vacía.\n');
  process.exit(0);
}

const estados = {};

console.log(`\n  Últimos ${cola.size} correos:\n`);

for (const doc of cola.docs) {
  const d = doc.data();
  const entrega = d['delivery'];
  const estado = entrega?.state ?? 'SIN PROCESAR';

  estados[estado] = (estados[estado] ?? 0) + 1;

  console.log(`  ${estado.padEnd(12)} ${(d['to'] ?? []).join(', ')}`);
  console.log(`               ${d['message']?.subject ?? '(sin asunto)'}`);

  if (entrega?.error) console.log(`               ✗ ${entrega.error}`);
  console.log('');
}

console.log('  Resumen:', Object.entries(estados).map(([k, v]) => `${k}: ${v}`).join(' · '));

if (estados['SIN PROCESAR']) {
  console.log('\n  «SIN PROCESAR» significa que la Function enviarCorreo no está desplegada,');
  console.log('  o que falló antes de arrancar. Míralo con:');
  console.log('  firebase functions:log --only enviarCorreo');
}

if (estados['DESCARTADO']) {
  console.log('\n  «DESCARTADO» son correos encolados hace más de 24 h. Es a propósito:');
  console.log('  evita que el primer despliegue mande de golpe toda la cola de pruebas.');
}

if (estados['ERROR']) {
  console.log('\n  Con «ERROR», el motivo sale arriba. Lo más común:');
  console.log('  · Username and Password not accepted → la contraseña de aplicación está mal');
  console.log('    copiada, o lleva los espacios que muestra Google. Va sin espacios.');
  console.log('  · SMTP sin configurar → falta functions/.env.veta-estudio-creativo o el');
  console.log('    secreto SMTP_PASSWORD. Los .env se leen al desplegar: vuelve a desplegar.');
}

console.log('');
