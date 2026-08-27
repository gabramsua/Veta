import { onCall } from 'firebase-functions/v2/https';

import { PLANTILLAS } from './plantillas.js';
import { REGION, exigirAdmin } from './comun.js';

/**
 * Devuelve las plantillas de serie al panel.
 *
 * El editor las necesita para poder enseñar el texto que se está enviando de
 * verdad cuando todavía no hay una versión personalizada. Antes salía un cuadro
 * vacío, y quien guardaba desde ahí sustituía una plantilla buena por lo que
 * hubiera escrito, sin haber visto nunca la original.
 *
 * Va por Function y no copiando el texto al cliente para que solo exista en un
 * sitio: si se duplicara, la de serie y la que se envía se separarían al primer
 * cambio y nadie se enteraría.
 */
export const getPlantillasPorDefecto = onCall({ region: REGION }, (peticion) => {
  exigirAdmin(peticion);

  return Object.entries(PLANTILLAS).map(([id, plantilla]) => ({
    id,
    subject: plantilla.subject,
    html: plantilla.html,
    descripcion: plantilla.descripcion,
  }));
});
