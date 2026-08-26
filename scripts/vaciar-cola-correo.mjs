/**
 * Vacía la colección `mail`.
 *
 *   npm run correo:vaciar
 *
 * Limpieza opcional. Las Functions llevan escribiendo en `mail/` desde el primer
 * día, aunque no hubiera nada que enviara, así que ahí dentro hay pruebas hacia
 * direcciones inventadas.
 *
 * Mandarlas de golpe desde la cuenta de Veta es la forma más rápida de que Gmail
 * la marque como spam, pero eso ya no puede pasar: `enviarCorreo` descarta todo
 * lo encolado hace más de 24 horas. Esto solo deja la colección limpia.
 */

import { existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const RUTA_CLAVE = process.env.CLAVE_SERVICIO ?? './clave-servicio.json';

if (!existsSync(RUTA_CLAVE)) {
  console.error(`\n✗ No encuentro ${RUTA_CLAVE}. Mira las instrucciones del README.\n`);
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(RUTA_CLAVE, 'utf8'))) });

const db = getFirestore();
const rl = createInterface({ input: stdin, output: stdout });

const cola = await db.collection('mail').get();

if (cola.empty) {
  console.log('\n  La cola ya está vacía. Puedes instalar la extensión sin riesgo.\n');
  rl.close();
  process.exit(0);
}

// Un vistazo a lo que hay, para poder decidir con conocimiento de causa.
const destinatarios = new Set();
cola.forEach((d) => (d.data()?.to ?? []).forEach((x) => destinatarios.add(x)));

console.log(`\n  Hay ${cola.size} correo(s) en la cola, para ${destinatarios.size} destinatario(s):\n`);
for (const d of [...destinatarios].slice(0, 10)) console.log(`    ${d}`);
if (destinatarios.size > 10) console.log(`    …y ${destinatarios.size - 10} más`);

console.log('\n  Si instalas la extensión sin vaciar esto, todos se enviarán de verdad.');

const confirmacion = (await rl.question('\n  Escribe "vaciar" para borrarlos: ')).trim();

if (confirmacion !== 'vaciar') {
  console.log('\n  Cancelado. No se ha borrado nada.\n');
  rl.close();
  process.exit(0);
}

let borrados = 0;

for (let i = 0; i < cola.docs.length; i += 400) {
  const lote = db.batch();
  cola.docs.slice(i, i + 400).forEach((d) => lote.delete(d.ref));
  await lote.commit();
  borrados += Math.min(400, cola.docs.length - i);
}

console.log(`\n  ✓ ${borrados} correo(s) borrados. Ya puedes instalar la extensión.\n`);
rl.close();
