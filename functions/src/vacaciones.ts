import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';

import { REGION, db } from './comun.js';

/**
 * El contador de vacaciones se reinicia cada año natural.
 *
 * Los periodos no se borran: sirven de histórico y el contador se calcula
 * filtrando por año. Esta función solo pone a cero el campo `diasVacaciones`
 * de cada administradora, que es el que se muestra como resumen.
 */
export const resetVacationCounters = onSchedule(
  { schedule: '0 3 1 1 *', timeZone: 'Europe/Madrid', region: REGION },
  async () => {
    const admins = await db.collection('admins').get();

    if (admins.empty) {
      logger.info('Sin administradoras: nada que reiniciar');
      return;
    }

    const lote = db.batch();
    admins.forEach((doc) => lote.update(doc.ref, { diasVacaciones: 0 }));
    await lote.commit();

    logger.info('Contadores de vacaciones reiniciados', { cuantas: admins.size });
  },
);
