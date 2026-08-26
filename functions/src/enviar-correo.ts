import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineSecret, defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import nodemailer from 'nodemailer';

import { REGION } from './comun.js';

/**
 * Envío de la cola de correo.
 *
 * Esto hacía antes la extensión Trigger Email. Se descartó porque el servicio de
 * extensiones se apaga el 31 de marzo de 2027 y, a partir de esa fecha, una
 * extensión instalada no se puede reconfigurar: cambiar de proveedor SMTP o
 * rotar la contraseña sería imposible sin borrar recursos a mano en Google
 * Cloud. Con esto, cambiar de proveedor es editar dos variables.
 *
 * El contrato con el resto del código no cambia: las demás Functions escriben en
 * `mail/` y esto lo envía.
 */

// Las credenciales viven en Secret Manager, nunca en el repositorio.
const SMTP_PASSWORD = defineSecret('SMTP_PASSWORD');

const SMTP_HOST = defineString('SMTP_HOST', { default: 'smtp.gmail.com' });
const SMTP_PORT = defineString('SMTP_PORT', { default: '465' });
const SMTP_USER = defineString('SMTP_USER', { default: '' });
const SMTP_FROM = defineString('SMTP_FROM', { default: '' });

/** Más de esto y damos por hecho que el correo se quedó atrás. */
const HORAS_MAXIMAS = 24;

interface DocumentoCorreo {
  to?: string[];
  replyTo?: string;
  message?: { subject?: string; html?: string };
  createdAt?: Timestamp;
  delivery?: { state?: string };
}

export const enviarCorreo = onDocumentCreated(
  {
    document: 'mail/{id}',
    region: REGION,
    secrets: [SMTP_PASSWORD],
    retry: false,
  },
  async (evento) => {
    const referencia = evento.data?.ref;
    const datos = evento.data?.data() as DocumentoCorreo | undefined;

    if (!referencia || !datos) return;

    const destinatarios = (datos.to ?? []).filter((x) => x && x.includes('@'));

    if (destinatarios.length === 0) {
      await referencia.update({
        delivery: { state: 'ERROR', error: 'Sin destinatario válido', intentadoAt: FieldValue.serverTimestamp() },
      });
      return;
    }

    /**
     * Descarte de correos rancios.
     *
     * Las Functions llevan encolando desde antes de que existiera un enviador.
     * Sin esto, el primer despliegue vaciaría de golpe toda la cola acumulada de
     * pruebas hacia direcciones inventadas, que es la forma más rápida de que
     * Gmail marque la cuenta como spam.
     */
    const creado = datos.createdAt?.toMillis() ?? 0;
    const antiguedadHoras = (Date.now() - creado) / (1000 * 60 * 60);

    if (creado > 0 && antiguedadHoras > HORAS_MAXIMAS) {
      logger.warn('Correo descartado por antiguo', {
        id: referencia.id,
        horas: Math.round(antiguedadHoras),
      });

      await referencia.update({
        delivery: {
          state: 'DESCARTADO',
          error: `Encolado hace ${Math.round(antiguedadHoras)} h, más de las ${HORAS_MAXIMAS} admitidas`,
          intentadoAt: FieldValue.serverTimestamp(),
        },
      });
      return;
    }

    const usuario = SMTP_USER.value();
    const password = SMTP_PASSWORD.value();

    if (!usuario || !password) {
      logger.error('SMTP sin configurar: falta SMTP_USER o el secreto SMTP_PASSWORD');
      await referencia.update({
        delivery: { state: 'ERROR', error: 'SMTP sin configurar', intentadoAt: FieldValue.serverTimestamp() },
      });
      return;
    }

    await referencia.update({ delivery: { state: 'PROCESSING' } });

    const puerto = Number(SMTP_PORT.value());

    const transporte = nodemailer.createTransport({
      host: SMTP_HOST.value(),
      port: puerto,
      // 465 va cifrado desde el saludo inicial; 587 empieza en claro y sube a
      // TLS con STARTTLS. Confundirlos es el fallo de configuración clásico.
      secure: puerto === 465,
      auth: { user: usuario, pass: password },
    });

    try {
      const info = await transporte.sendMail({
        from: SMTP_FROM.value() || usuario,
        to: destinatarios.join(', '),
        replyTo: datos.replyTo,
        subject: datos.message?.subject ?? '',
        html: datos.message?.html ?? '',
      });

      await referencia.update({
        delivery: {
          state: 'SUCCESS',
          messageId: info.messageId ?? null,
          enviadoAt: FieldValue.serverTimestamp(),
        },
      });

      logger.info('Correo enviado', { id: referencia.id, a: destinatarios });
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';

      logger.error('Fallo al enviar', { id: referencia.id, error: mensaje });

      await referencia.update({
        delivery: {
          state: 'ERROR',
          error: mensaje,
          intentadoAt: FieldValue.serverTimestamp(),
        },
      });
    }
  },
);
