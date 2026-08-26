import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

import { REGION, db } from './comun.js';

/**
 * Espejo público de los periodos de vacaciones.
 *
 * `vacations` solo lo pueden leer las administradoras: lleva quién ha cogido
 * cada periodo y notas internas. Pero la web pública necesita saber qué días
 * están cerrados para no ofrecerlos.
 *
 * Esta función mantiene en `settings/cierres` una copia reducida —solo fechas y
 * a qué talleres afecta— que sí es de lectura pública.
 */
export const onVacationWritten = onDocumentWritten(
  { document: 'vacations/{id}', region: REGION },
  async () => {
    const periodos = await db.collection('vacations').get();
    const ahora = Date.now();

    const publicos = periodos.docs
      .map((doc) => {
        const datos = doc.data();
        return {
          fechaInicio: datos['fechaInicio'] as Timestamp,
          fechaFin: datos['fechaFin'] as Timestamp,
          workshopIds: (datos['workshopIds'] ?? []) as string[],
        };
      })
      // Los periodos ya pasados no le sirven de nada a la web.
      .filter((p) => p.fechaFin.toMillis() >= ahora - 24 * 60 * 60 * 1000);

    await db.doc('settings/cierres').set({ periodos: publicos });

    logger.info('Cierres públicos actualizados', { cuantos: publicos.length });
  },
);
