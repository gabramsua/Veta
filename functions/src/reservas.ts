import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';

import { REGION, db, exigirAdmin, textoObligatorio } from './comun.js';
import { correoDeVeta, encolarCorreo, respuestasAHtml } from './emails.js';

interface DatosReserva {
  tipo: 'taller' | 'bono';
  sessionId: string | null;
  bonoId: string | null;
  nombre: string;
  email: string;
  telefono: string;
  nPersonas: number;
  respuestas: Record<string, string>;
  status: 'pendiente' | 'confirmada' | 'cancelada';
  origen?: 'web' | 'panel';
}

const ETIQUETAS_TIPO: Record<string, string> = {
  papeleria: 'papelería de bodas',
  liveart: 'live art',
  encargo: 'encargo',
  evento: 'taller privado',
  contacto: 'contacto',
};

// Las piezas se guardan por su clave. Las reglas de Firestore solo admiten estas
// seis, así que cualquier otra cosa que llegue aquí es un dato viejo.
const ETIQUETAS_PIEZA: Record<string, string> = {
  invitaciones: 'Invitaciones',
  seating: 'Seating plan y meseros',
  minutas: 'Minutas',
  marcasitios: 'Marcasitios',
  paipai: 'PaiPai',
  pack: 'Pack completo',
};

function nombresDePiezas(piezas: unknown): string {
  if (!Array.isArray(piezas)) return '';

  return piezas
    .filter((pieza): pieza is string => typeof pieza === 'string')
    .map((pieza) => ETIQUETAS_PIEZA[pieza] ?? pieza)
    .join(', ');
}

function formatear(fecha: Timestamp | null | undefined): string {
  if (!fecha) return '';

  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  }).format(fecha.toDate());
}

// Nombre del taller o del bono, y la fecha si la hay.
async function contexto(
  datos: DatosReserva,
): Promise<{ taller: string; fecha: string; precio: number; etiqueta: string }> {
  if (datos.tipo === 'bono' && datos.bonoId) {
    const bono = await db.doc(`bonos/${datos.bonoId}`).get();
    return {
      taller: (bono.data()?.['titulo'] as string) ?? 'Bono mensual',
      fecha: '',
      precio: (bono.data()?.['precio'] as number) ?? 0,
      etiqueta: 'Bono',
    };
  }

  if (datos.sessionId) {
    const sesion = await db.doc(`sessions/${datos.sessionId}`).get();
    const workshopId = sesion.data()?.['workshopId'] as string | undefined;
    const taller = workshopId ? await db.doc(`workshops/${workshopId}`).get() : null;

    return {
      taller: (taller?.data()?.['titulo'] as string) ?? 'Taller',
      fecha: formatear(sesion.data()?.['fechaInicio'] as Timestamp | undefined),
      precio: (taller?.data()?.['precio'] as number) ?? 0,
      etiqueta: 'Taller',
    };
  }

  return { taller: 'Taller', fecha: '', precio: 0, etiqueta: 'Taller' };
}

// --- Correos al recibir una solicitud de presupuesto ---
export const onRequestCreated = onDocumentCreated(
  { document: 'requests/{id}', region: REGION },
  async (evento) => {
    const datos = evento.data?.data();
    if (!datos) return;

    const piezas = nombresDePiezas(datos['piezas']);

    const comunes = {
      tipo: ETIQUETAS_TIPO[datos['tipo'] as string] ?? (datos['tipo'] as string),
      piezas,
      nombre: datos['nombre'],
      email: datos['email'],
      telefono: datos['telefono'],
      respuestasHtml: respuestasAHtml((datos['respuestas'] ?? {}) as Record<string, string>),
    };

    // El aviso interno responde a la clienta, no a Veta.
    await encolarCorreo(await correoDeVeta(), 'solicitud-veta', comunes, datos['email'] as string);
    await encolarCorreo(datos['email'] as string, 'solicitud-cliente', comunes);
  },
);

// --- Correos al recibir una solicitud de plaza ---
export const onBookingCreated = onDocumentCreated(
  { document: 'bookings/{id}', region: REGION },
  async (evento) => {
    const datos = evento.data?.data() as DatosReserva | undefined;
    if (!datos) return;

    // Las que apunta Carmen a mano no han solicitado nada: mandarles un «hemos
    // recibido tu solicitud» sería mentira, y el aviso interno se lo enviaría a
    // sí misma un segundo después de escribirlo. `crearReservaManual` ya se
    // ocupa de avisar a la clienta si hace falta.
    if (datos.origen === 'panel') return;

    const { taller, fecha, etiqueta } = await contexto(datos);

    const comunes = {
      taller,
      fecha,
      etiqueta,
      nombre: datos.nombre,
      email: datos.email,
      telefono: datos.telefono,
      nPersonas: datos.nPersonas,
      respuestasHtml: respuestasAHtml(datos.respuestas ?? {}),
    };

    await encolarCorreo(await correoDeVeta(), 'reserva-veta', comunes, datos.email);
    await encolarCorreo(datos.email, 'reserva-cliente', comunes);
  },
);

// --- Correo al cambiar el estado desde el panel ---
export const onBookingUpdated = onDocumentUpdated(
  { document: 'bookings/{id}', region: REGION },
  async (evento) => {
    const antes = evento.data?.before.data() as DatosReserva | undefined;
    const despues = evento.data?.after.data() as DatosReserva | undefined;

    if (!antes || !despues || antes.status === despues.status) return;

    const { taller, fecha, precio, etiqueta } = await contexto(despues);

    if (despues.status === 'confirmada') {
      await encolarCorreo(despues.email, 'reserva-confirmada', {
        nombre: despues.nombre,
        taller,
        fecha,
        etiqueta,
        nPersonas: despues.nPersonas,
        importe: precio * despues.nPersonas,
      });
    }

    if (despues.status === 'cancelada') {
      await encolarCorreo(despues.email, 'reserva-cancelada', {
        nombre: despues.nombre,
        taller,
        etiqueta,
      });
    }
  },
);

/**
 * Confirmar o cancelar una reserva, moviendo las plazas de la sesión.
 *
 * Va en una transacción porque es la única operación con carrera real: si dos
 * administradoras confirman a la vez la última plaza, sin transacción las dos
 * leerían el mismo cupo y la sesión acabaría sobrevendida.
 */
export const confirmBooking = onCall<{ bookingId: string; status: 'confirmada' | 'cancelada' }>(
  { region: REGION },
  async (peticion) => {
    exigirAdmin(peticion);

    const bookingId = textoObligatorio(peticion.data?.bookingId, 'reserva', 128);
    const status = peticion.data?.status;

    if (status !== 'confirmada' && status !== 'cancelada') {
      throw new HttpsError('invalid-argument', 'El estado no es válido.');
    }

    return db.runTransaction(async (tx) => {
      const refReserva = db.doc(`bookings/${bookingId}`);
      const reserva = await tx.get(refReserva);

      if (!reserva.exists) {
        throw new HttpsError('not-found', 'Esa reserva no existe.');
      }

      const datos = reserva.data() as DatosReserva;

      if (datos.status === status) {
        throw new HttpsError('failed-precondition', 'La reserva ya estaba en ese estado.');
      }

      // Los bonos no consumen plazas: no tienen sesión asociada.
      if (datos.tipo === 'bono' || !datos.sessionId) {
        tx.update(refReserva, {
          status,
          confirmadaAt: status === 'confirmada' ? FieldValue.serverTimestamp() : null,
        });
        return { ok: true, plazasLibres: null };
      }

      const refSesion = db.doc(`sessions/${datos.sessionId}`);
      const sesion = await tx.get(refSesion);

      if (!sesion.exists) {
        throw new HttpsError('not-found', 'La sesión de esa reserva ya no existe.');
      }

      const totales = (sesion.data()?.['plazasTotales'] as number) ?? 0;
      const confirmadas = (sesion.data()?.['plazasConfirmadas'] as number) ?? 0;

      let nuevasConfirmadas = confirmadas;

      if (status === 'confirmada') {
        nuevasConfirmadas = confirmadas + datos.nPersonas;

        if (nuevasConfirmadas > totales) {
          throw new HttpsError(
            'failed-precondition',
            `No caben: quedan ${totales - confirmadas} plaza(s) y esta reserva pide ${datos.nPersonas}.`,
          );
        }
      } else if (datos.status === 'confirmada') {
        // Solo se devuelven plazas si estaban descontadas.
        nuevasConfirmadas = Math.max(0, confirmadas - datos.nPersonas);
      }

      tx.update(refSesion, { plazasConfirmadas: nuevasConfirmadas });
      tx.update(refReserva, {
        status,
        confirmadaAt: status === 'confirmada' ? FieldValue.serverTimestamp() : null,
      });

      logger.info('Reserva actualizada', { bookingId, status, nuevasConfirmadas });

      return { ok: true, plazasLibres: totales - nuevasConfirmadas };
    });
  },
);

/**
 * Apuntar a alguien a mano desde el panel.
 *
 * Nace ya confirmada y descuenta plazas en el mismo paso. Es lo que espera
 * quien apunta a una clienta que ha llamado por teléfono: ya está hablado, no
 * hay nada que confirmar después. Crearla pendiente y obligar a un segundo clic
 * sería repetir el flujo de la web para un caso que no lo necesita.
 *
 * Va en Function y no en cliente por lo mismo que `confirmBooking`: mover el
 * contador de plazas tiene carrera, y las reglas de Firestore impiden —a
 * propósito— que nadie lo toque desde el navegador.
 *
 * El correo es opcional: muchas de estas reservas se apuntan con la clienta
 * delante o al teléfono, y a veces no hay ni dirección que usar.
 */
export const crearReservaManual = onCall<{
  tipo: 'taller' | 'bono';
  sessionId: string | null;
  bonoId: string | null;
  nombre: string;
  email: string;
  telefono: string;
  nPersonas: number;
  notasInternas: string;
  avisar: boolean;
}>({ region: REGION }, async (peticion) => {
  exigirAdmin(peticion);

  const datos = peticion.data ?? ({} as Record<string, never>);
  const tipo = datos.tipo;

  if (tipo !== 'taller' && tipo !== 'bono') {
    throw new HttpsError('invalid-argument', 'Hay que decir si es un taller o un bono.');
  }

  const nombre = textoObligatorio(datos.nombre, 'nombre', 120);
  const email = typeof datos.email === 'string' ? datos.email.trim() : '';
  const telefono = typeof datos.telefono === 'string' ? datos.telefono.trim().slice(0, 30) : '';
  const notasInternas =
    typeof datos.notasInternas === 'string' ? datos.notasInternas.trim().slice(0, 2000) : '';

  if (email && !email.includes('@')) {
    throw new HttpsError('invalid-argument', 'Ese correo no parece válido.');
  }

  // Sin ninguna de las dos no hay forma de volver a contactar con la persona, y
  // una reserva a la que no se puede avisar de un cambio de fecha no sirve.
  if (!email && !telefono) {
    throw new HttpsError('invalid-argument', 'Hace falta al menos un teléfono o un correo.');
  }

  const nPersonas = Number(datos.nPersonas);

  if (!Number.isInteger(nPersonas) || nPersonas < 1 || nPersonas > 20) {
    throw new HttpsError('invalid-argument', 'El número de personas tiene que estar entre 1 y 20.');
  }

  const sessionId = tipo === 'taller' ? textoObligatorio(datos.sessionId, 'sesión', 128) : null;
  const bonoId = tipo === 'bono' ? textoObligatorio(datos.bonoId, 'bono', 128) : null;

  const documento = {
    tipo,
    sessionId,
    bonoId,
    nombre,
    email,
    telefono,
    nPersonas,
    respuestas: {},
    status: 'confirmada' as const,
    origen: 'panel' as const,
    createdAt: FieldValue.serverTimestamp(),
    confirmadaAt: FieldValue.serverTimestamp(),
    notasInternas,
  };

  const refReserva = db.collection('bookings').doc();

  if (tipo === 'bono') {
    // Los bonos no consumen plazas, así que no hace falta transacción.
    await refReserva.set(documento);
  } else {
    await db.runTransaction(async (tx) => {
      const refSesion = db.doc(`sessions/${sessionId}`);
      const sesion = await tx.get(refSesion);

      if (!sesion.exists) {
        throw new HttpsError('not-found', 'Esa sesión ya no existe.');
      }

      const totales = (sesion.data()?.['plazasTotales'] as number) ?? 0;
      const confirmadas = (sesion.data()?.['plazasConfirmadas'] as number) ?? 0;

      if (confirmadas + nPersonas > totales) {
        throw new HttpsError(
          'failed-precondition',
          `No caben: quedan ${totales - confirmadas} plaza(s) y estás apuntando ${nPersonas}.`,
        );
      }

      tx.update(refSesion, { plazasConfirmadas: confirmadas + nPersonas });
      tx.set(refReserva, documento);
    });
  }

  logger.info('Reserva creada desde el panel', { bookingId: refReserva.id, tipo, nPersonas });

  if (datos.avisar && email) {
    // `contexto` solo mira el tipo y el identificador; el resto no le hace falta.
    const { taller, fecha, precio, etiqueta } = await contexto({
      tipo,
      sessionId,
      bonoId,
    } as DatosReserva);

    await encolarCorreo(email, 'reserva-confirmada', {
      nombre,
      taller,
      fecha,
      etiqueta,
      nPersonas,
      importe: precio * nPersonas,
    });
  }

  return { ok: true, bookingId: refReserva.id };
});
