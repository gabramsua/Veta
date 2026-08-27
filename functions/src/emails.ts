import { FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

import { PLANTILLAS } from './plantillas.js';
import { db } from './comun.js';

const CORREO_POR_DEFECTO = 'gabramsua@gmail.com';

export async function correoDeVeta(): Promise<string> {
  const ajustes = await db.doc('settings/site').get();
  const email = ajustes.data()?.['contacto']?.['email'];

  return typeof email === 'string' && email.includes('@') ? email : CORREO_POR_DEFECTO;
}

/**
 * Encola un correo escribiendo en `mail/`, que es la colección que consume la
 * Function `enviarCorreo`.
 *
 * La plantilla se busca primero en Firestore, para que sea editable desde el
 * panel, y solo si no existe se usa la de código. Así una plantilla mal borrada
 * no deja a nadie sin acuse de recibo.
 */
export async function encolarCorreo(
  destinatario: string,
  plantillaId: string,
  datos: Record<string, unknown>,
  responderA?: string,
): Promise<void> {
  if (!destinatario || !destinatario.includes('@')) {
    logger.warn('Correo sin destinatario válido', { plantillaId, destinatario });
    return;
  }

  const guardada = await db.doc(`templates/${plantillaId}`).get();
  const plantilla = guardada.exists
    ? (guardada.data() as { subject: string; html: string })
    : PLANTILLAS[plantillaId];

  if (!plantilla) {
    logger.error('Plantilla inexistente', { plantillaId });
    return;
  }

  // `replyTo` es lo que hace útil el aviso interno: el correo sale de la cuenta
  // de Veta, así que sin esto, al pulsar «Responder» se lo mandarían a sí mismas
  // en lugar de a la clienta.
  //
  // La clave se omite si no hay valor: Firestore rechaza `undefined`.
  const correo: Record<string, unknown> = {
    to: [destinatario],
    message: {
      subject: sustituir(plantilla.subject, datos),
      html: sustituir(plantilla.html, datos),
    },
    createdAt: FieldValue.serverTimestamp(),
  };

  if (responderA && responderA.includes('@')) {
    correo['replyTo'] = responderA;
  }

  await db.collection('mail').add(correo);
}

/**
 * Sustitución mínima al estilo Handlebars: {{clave}}, {{{sinEscapar}}} y
 * {{#if clave}}…{{/if}}. Suficiente para estas plantillas y sin dependencias.
 *
 * Las claves terminadas en `Html` no se escapan, ni siquiera con dos llaves.
 * El panel le ofrece a Carmen la lista de huecos disponibles y los escribe todos
 * igual, con dos llaves; si `respuestasHtml` necesitara tres, la primera
 * plantilla que editara saldría con la tabla en crudo. Que el motor lo resuelva
 * es más seguro que confiar en que se acuerde de una excepción.
 *
 * La contrapartida es una regla que hay que respetar: en una clave `*Html` solo
 * se mete HTML que hayamos construido nosotros. `respuestasAHtml` escapa cada
 * etiqueta y cada valor antes de montar la tabla, así que lo que escriba una
 * clienta en un formulario público nunca llega vivo hasta aquí.
 */
function sustituir(texto: string, datos: Record<string, unknown>): string {
  const valor = (clave: string) => String(datos[clave] ?? '');
  const esHtml = (clave: string) => clave.endsWith('Html');

  return texto
    .replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, clave: string, cuerpo: string) =>
      datos[clave] ? cuerpo : '',
    )
    .replace(/\{\{\{(\w+)\}\}\}/g, (_, clave: string) => valor(clave))
    .replace(/\{\{(\w+)\}\}/g, (_, clave: string) =>
      esHtml(clave) ? valor(clave) : escapar(valor(clave)),
    );
}

function escapar(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/**
 * Da formato a una fecha suelta del tipo `2027-06-12`, que es lo que guarda una
 * pregunta de tipo fecha.
 *
 * Se parte la cadena a mano en vez de pasar por `Date`: `new Date('2027-06-12')`
 * la interpreta como medianoche UTC y al formatearla en otro huso puede mostrar
 * el día anterior. Una fecha de boda no tiene hora, así que meter un `Date` por
 * medio solo añade formas de equivocarse.
 *
 * Si la cadena no tiene esa forma se devuelve tal cual: puede ser la respuesta a
 * una pregunta de texto que casualmente parecía una fecha.
 *
 * Gemela de `formatearFechaIso` en `src/app/core/data/fechas.ts`. Está duplicada
 * porque el cliente y las Functions se compilan por separado y no comparten
 * código; si se toca una, hay que tocar la otra.
 */
function formatearFechaIso(valor: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim());

  if (!partes) return valor;

  const [, anio, mes, dia] = partes;
  const nombreMes = MESES[Number(mes) - 1];

  return nombreMes ? `${Number(dia)} de ${nombreMes} de ${anio}` : valor;
}

/**
 * Convierte el mapa de respuestas en una tabla legible.
 *
 * El formulario guarda cada respuesta dos veces: `{id}` con el valor y
 * `{id}__etiqueta` con el texto de la pregunta. Así el correo sigue siendo
 * comprensible aunque después se borre la pregunta del panel.
 */
export function respuestasAHtml(respuestas: Record<string, string>): string {
  const filas = Object.entries(respuestas)
    .filter(([clave]) => !clave.endsWith('__etiqueta'))
    .map(([clave, valor]) => {
      const etiqueta = respuestas[`${clave}__etiqueta`] ?? 'Respuesta';
      return `<tr>
        <td style="padding:8px 12px 8px 0;color:#6B635B;font-size:13px;vertical-align:top">${escapar(etiqueta)}</td>
        <td style="padding:8px 0;font-size:14px">${escapar(formatearFechaIso(valor))}</td>
      </tr>`;
    });

  if (filas.length === 0) return '';

  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">${filas.join('')}</table>`;
}
