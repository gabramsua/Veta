/**
 * Utilidades compartidas por los scripts de datos de ejemplo.
 *
 * La pieza importante es el registro: cada documento y cada archivo que crea la
 * semilla queda anotado en `_semilla/registro`. El borrado lee esa lista y quita
 * exactamente eso, ni un documento más. Así los datos de ejemplo se pueden
 * mezclar con contenido real sin miedo a llevárselo por delante.
 */

import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const RUTA_CLAVE = process.env.CLAVE_SERVICIO ?? './clave-servicio.json';
const REGISTRO = '_semilla/registro';

export function arrancar() {
  if (!existsSync(RUTA_CLAVE)) {
    console.error(
      `\n✗ No encuentro ${RUTA_CLAVE}.\n` +
        '  Descárgala en: Consola de Firebase → Configuración del proyecto →\n' +
        '  Cuentas de servicio → Generar nueva clave privada.\n',
    );
    process.exit(1);
  }

  const clave = JSON.parse(readFileSync(RUTA_CLAVE, 'utf8'));

  if (clave.project_id !== 'veta-estudio-creativo') {
    console.error(`\n✗ Esa clave es del proyecto "${clave.project_id}".\n`);
    process.exit(1);
  }

  initializeApp({
    credential: cert(clave),
    storageBucket: 'veta-estudio-creativo.firebasestorage.app',
  });

  return { db: getFirestore(), bucket: getStorage().bucket() };
}

export async function leerRegistro(db) {
  const doc = await db.doc(REGISTRO).get();

  return {
    documentos: (doc.data()?.documentos ?? []),
    archivos: (doc.data()?.archivos ?? []),
  };
}

export async function guardarRegistro(db, registro) {
  await db.doc(REGISTRO).set({ ...registro, actualizado: new Date().toISOString() });
}

/**
 * Sube un marcador de imagen a Storage y devuelve su URL de descarga.
 *
 * Son SVG generados aquí mismo, no fotos: la idea es que se vea la maquetación
 * con imágenes reales de verdad —con su peso, su proporción y su carga— sin
 * inventarse fotografías que no son de Veta.
 */
export async function subirMarcador(bucket, nombre, texto, fondo, ancho = 1200, alto = 900) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">
  <rect width="${ancho}" height="${alto}" fill="${fondo}"/>
  <text x="50%" y="50%" fill="#2E2A26" fill-opacity="0.45" font-family="Georgia,serif"
        font-size="${Math.round(ancho / 18)}" text-anchor="middle" dominant-baseline="middle">
    ${texto}
  </text>
</svg>`;

  const ruta = `media/ejemplo/${nombre}.svg`;
  const token = randomUUID();
  const archivo = bucket.file(ruta);

  await archivo.save(Buffer.from(svg), {
    contentType: 'image/svg+xml',
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
  });

  const url =
    `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
    `${encodeURIComponent(ruta)}?alt=media&token=${token}`;

  return { url, storagePath: ruta, width: ancho, height: alto, bytes: svg.length };
}

export const PALETA = {
  crema: '#F2EBE1',
  arena: '#E3D5C4',
  arenaOsc: '#CBB9A3',
  oliva: '#8B9375',
  terracota: '#D9A183',
};

export function enDias(dias, hora = 11) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(hora, 0, 0, 0);
  return fecha;
}
