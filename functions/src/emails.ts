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
 * extensión Trigger Email.
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

// Sustitución mínima al estilo Handlebars: {{clave}}, {{{sinEscapar}}} y
// {{#if clave}}…{{/if}}. Suficiente para estas plantillas y sin dependencias.
function sustituir(texto: string, datos: Record<string, unknown>): string {
  return texto
    .replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, clave: string, cuerpo: string) =>
      datos[clave] ? cuerpo : '',
    )
    .replace(/\{\{\{(\w+)\}\}\}/g, (_, clave: string) => String(datos[clave] ?? ''))
    .replace(/\{\{(\w+)\}\}/g, (_, clave: string) => escapar(String(datos[clave] ?? '')));
}

function escapar(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
        <td style="padding:8px 0;font-size:14px">${escapar(valor)}</td>
      </tr>`;
    });

  if (filas.length === 0) return '';

  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">${filas.join('')}</table>`;
}
