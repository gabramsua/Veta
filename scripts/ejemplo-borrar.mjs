/**
 * Borra los datos de ejemplo.
 *
 *   npm run ejemplo:borrar
 *
 * Solo toca lo que anotó `ejemplo-crear.mjs` en `_semilla/registro`. Si Carmen ha
 * creado contenido real de por medio, se queda intacto.
 *
 * Para los documentos de páginas (`pages/*`), que pueden llevar textos reales
 * escritos encima, se pide confirmación aparte.
 */

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import { arrancar, guardarRegistro, leerRegistro } from './comun-ejemplo.mjs';

const { db, bucket } = arrancar();
const rl = createInterface({ input: stdin, output: stdout });

const registro = await leerRegistro(db);

if (registro.documentos.length === 0 && registro.archivos.length === 0) {
  console.log('\n  No hay datos de ejemplo registrados. Nada que borrar.\n');
  rl.close();
  process.exit(0);
}

// Las páginas se separan: puede haber textos reales escritos encima del ejemplo.
const paginas = registro.documentos.filter((d) => d.coleccion === 'pages');
const resto = registro.documentos.filter((d) => d.coleccion !== 'pages');

const porColeccion = resto.reduce((mapa, d) => {
  mapa[d.coleccion] = (mapa[d.coleccion] ?? 0) + 1;
  return mapa;
}, {});

console.log('\n  Se va a borrar:\n');
for (const [coleccion, cuantos] of Object.entries(porColeccion)) {
  console.log(`    ${String(cuantos).padStart(4)} en ${coleccion}`);
}
console.log(`    ${String(registro.archivos.length).padStart(4)} imágenes en Storage`);

const confirmacion = (await rl.question('\n  Escribe "borrar" para confirmar: ')).trim();

if (confirmacion !== 'borrar') {
  console.log('\n  Cancelado. No se ha tocado nada.\n');
  rl.close();
  process.exit(0);
}

// Firestore admite 500 operaciones por lote.
let borrados = 0;

for (let i = 0; i < resto.length; i += 400) {
  const lote = db.batch();

  for (const { coleccion, id } of resto.slice(i, i + 400)) {
    lote.delete(db.doc(`${coleccion}/${id}`));
  }

  await lote.commit();
  borrados += Math.min(400, resto.length - i);
}

console.log(`\n  ✓ ${borrados} documentos borrados`);

let archivosBorrados = 0;

for (const ruta of registro.archivos) {
  try {
    await bucket.file(ruta).delete();
    archivosBorrados++;
  } catch {
    // Si ya no está, mejor: el objetivo es que no quede.
  }
}

console.log(`  ✓ ${archivosBorrados} imágenes borradas de Storage`);

let paginasBorradas = 0;

if (paginas.length > 0) {
  console.log(`\n  Quedan ${paginas.length} página(s) con textos de ejemplo:`);
  for (const p of paginas) console.log(`    pages/${p.id}`);
  console.log('\n  Si habéis escrito textos reales encima, borrarlos los perdería.');

  const respuesta = (await rl.question('  ¿Borrar también los textos? (s/N): ')).trim().toLowerCase();

  if (respuesta === 's' || respuesta === 'si' || respuesta === 'sí') {
    const lote = db.batch();
    for (const { id } of paginas) lote.delete(db.doc(`pages/${id}`));
    await lote.commit();
    paginasBorradas = paginas.length;
    console.log(`  ✓ ${paginasBorradas} páginas borradas`);
  } else {
    console.log('  Se conservan. Puedes editarlos desde Panel → Contenido → Textos de la web.');
  }
}

// El registro se queda solo con lo que no se ha llegado a borrar.
await guardarRegistro(db, {
  documentos: paginasBorradas > 0 ? [] : paginas,
  archivos: [],
});

console.log('\n  Hecho.\n');
rl.close();
