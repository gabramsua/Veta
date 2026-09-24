/**
 * Migra los datos afectados por dos renombrados de septiembre de 2026.
 *
 *   npm run migrar:renombrados
 *
 *   1. La categoría de papelería `laminas` pasa a `paipai`.
 *   2. El campo `precioMes` de los bonos pasa a `precio`.
 *   3. Se siembran las preguntas del formulario de taller privado, que es nuevo
 *      y nacería vacío: sin ellas solo pediría nombre, correo y teléfono, y
 *      Carmen tendría que llamar para enterarse de qué quieren.
 *
 * Sin esto, lo que Carmen ya hubiera metido se quedaría huérfano: un producto
 * con `categoria: 'laminas'` no encaja en ninguna subsección y desaparece de la
 * web, y un bono sin `precio` mostraría cero euros.
 *
 * Es idempotente: se puede ejecutar dos veces sin estropear nada. Lo que ya está
 * migrado se cuenta como omitido.
 */

import { existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { cert, initializeApp } from 'firebase-admin/app';

const RUTA_CLAVE = process.env.CLAVE_SERVICIO ?? './clave-servicio.json';

if (!existsSync(RUTA_CLAVE)) {
  console.error(`\n✗ No encuentro ${RUTA_CLAVE}. Mira las instrucciones del README.\n`);
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(RUTA_CLAVE, 'utf8'))) });

const db = getFirestore();

// --- Qué habría que tocar ---

const productos = await db.collection('products').where('categoria', '==', 'laminas').get();
const portfolio = await db.collection('portfolio').where('seccion', '==', 'laminas').get();
const paginaVieja = await db.doc('pages/papeleria-laminas').get();

const bonos = await db.collection('bonos').get();
const bonosPorMigrar = bonos.docs.filter((d) => d.data().precioMes !== undefined);

// Las solicitudes ya enviadas guardan las piezas pedidas. No se tocan los
// importes ni las respuestas, pero sí la etiqueta, para que la bandeja siga
// diciendo lo mismo que la web.
const solicitudes = await db.collection('requests').get();
const solicitudesPorMigrar = solicitudes.docs.filter((d) =>
  Array.isArray(d.data().piezas) && d.data().piezas.includes('laminas'),
);

/**
 * Preguntas de partida del formulario de taller privado.
 *
 * Solo se crean si no hay ninguna: si Carmen ya las ha tocado desde el panel,
 * volverían a aparecer duplicadas cada vez que se ejecutara el script.
 */
const PREGUNTAS_EVENTO = [
  { etiqueta: '¿Qué celebráis?', tipo: 'opciones', opciones: ['Despedida', 'Cumpleaños', 'Regalo', 'Otra cosa'], obligatoria: true },
  { etiqueta: '¿Cuántas personas seríais?', tipo: 'texto', opciones: [], obligatoria: true },
  { etiqueta: '¿Qué día os vendría bien?', tipo: 'fecha', opciones: [], obligatoria: false },
  { etiqueta: '¿Qué os apetece hacer: cerámica, pintura…?', tipo: 'textarea', opciones: [], obligatoria: false },
];

const preguntasEvento = await db
  .collection('formQuestions')
  .where('formulario', '==', 'evento')
  .get();

const faltanPreguntas = preguntasEvento.empty;

const total =
  productos.size +
  portfolio.size +
  (paginaVieja.exists ? 1 : 0) +
  bonosPorMigrar.length +
  solicitudesPorMigrar.length +
  (faltanPreguntas ? PREGUNTAS_EVENTO.length : 0);

if (total === 0) {
  console.log('\n  No hay nada que migrar. Los datos ya están al día.\n');
  process.exit(0);
}

console.log('\n  Se va a migrar:\n');
if (productos.size) console.log(`  · ${productos.size} producto(s) de papelería: laminas → paipai`);
if (portfolio.size) console.log(`  · ${portfolio.size} imagen(es) de portfolio: laminas → paipai`);
if (paginaVieja.exists) console.log('  · el contenido de la página «Láminas» → «PaiPai»');
if (bonosPorMigrar.length) console.log(`  · ${bonosPorMigrar.length} bono(s): precioMes → precio`);
if (solicitudesPorMigrar.length) {
  console.log(`  · ${solicitudesPorMigrar.length} solicitud(es) con la pieza «laminas»`);
}
if (faltanPreguntas) {
  console.log(`  · ${PREGUNTAS_EVENTO.length} pregunta(s) del formulario de taller privado`);
}

const rl = createInterface({ input: stdin, output: stdout });
const respuesta = await rl.question('\n  ¿Seguimos? (escribe SI) ');
rl.close();

if (respuesta.trim().toUpperCase() !== 'SI') {
  console.log('\n  Cancelado. No se ha tocado nada.\n');
  process.exit(0);
}

const lote = db.batch();

for (const doc of productos.docs) lote.update(doc.ref, { categoria: 'paipai' });
for (const doc of portfolio.docs) lote.update(doc.ref, { seccion: 'paipai' });

for (const doc of bonosPorMigrar) {
  lote.update(doc.ref, {
    precio: doc.data().precioMes ?? 0,
    precioMes: FieldValue.delete(),
  });
}

for (const doc of solicitudesPorMigrar) {
  lote.update(doc.ref, {
    piezas: doc.data().piezas.map((p) => (p === 'laminas' ? 'paipai' : p)),
  });
}

/**
 * La página se copia, no se mueve: el id de un documento no se puede cambiar.
 *
 * La vieja se borra después de escribir la nueva, para que un fallo a mitad no
 * deje a Carmen sin el texto que había escrito.
 */
if (paginaVieja.exists) {
  lote.set(db.doc('pages/papeleria-paipai'), paginaVieja.data(), { merge: true });
  lote.delete(paginaVieja.ref);
}

if (faltanPreguntas) {
  PREGUNTAS_EVENTO.forEach((pregunta, indice) => {
    lote.set(db.collection('formQuestions').doc(), {
      ...pregunta,
      formulario: 'evento',
      orden: indice + 1,
      activa: true,
    });
  });
}

await lote.commit();

console.log(`\n  ✓ Migrados ${total} documento(s).\n`);
console.log('  Comprueba en el panel que PaiPai tiene sus modelos y su texto,');
console.log('  que los bonos siguen mostrando su precio, y que el formulario de');
console.log('  taller privado tiene sus preguntas en Preguntas de formularios.\n');
