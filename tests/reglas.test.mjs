/**
 * Tests de las reglas de seguridad de Firestore.
 *
 *   npm run test:reglas
 *
 * Se ejecutan contra el emulador, nunca contra el proyecto real. Comprueban lo
 * que de verdad protege los datos de las clientas: que un visitante anónimo
 * pueda leer el catálogo y enviar una solicitud, pero no ver ni tocar lo que hay
 * dentro de las bandejas.
 *
 * Si algún test falla, no despliegues las reglas.
 */

import { readFileSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

let entorno;

const UID_ADMIN = 'admin-carmen';
const UID_OTRA = 'admin-maripepi';

/** Una reserva con exactamente los campos que las reglas aceptan. */
function reservaValida(extra = {}) {
  return {
    tipo: 'taller',
    sessionId: 'sesion-1',
    bonoId: null,
    nombre: 'Ana Pérez',
    email: 'ana@example.com',
    telefono: '600111222',
    nPersonas: 2,
    respuestas: { p1: 'Nunca he hecho cerámica', p1__etiqueta: '¿Has hecho cerámica antes?' },
    status: 'pendiente',
    createdAt: serverTimestamp(),
    confirmadaAt: null,
    notasInternas: '',
    ...extra,
  };
}

function solicitudValida(extra = {}) {
  return {
    tipo: 'papeleria',
    nombre: 'Lucía Gómez',
    email: 'lucia@example.com',
    telefono: '600333444',
    respuestas: {},
    status: 'nueva',
    createdAt: serverTimestamp(),
    notasInternas: '',
    ...extra,
  };
}

before(async () => {
  entorno = await initializeTestEnvironment({
    projectId: 'veta-reglas-test',
    firestore: {
      rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

after(async () => {
  await entorno?.cleanup();
});

const anonimo = () => entorno.unauthenticatedContext().firestore();
const admin = (uid = UID_ADMIN) =>
  entorno.authenticatedContext(uid, { admin: true }).firestore();
// Alguien con cuenta pero sin el custom claim: el caso de una administradora
// desactivada, a la que setAdminEnabled le ha quitado el claim.
const sinClaim = () => entorno.authenticatedContext('cuenta-sin-permisos').firestore();

describe('Catálogo público', () => {
  it('cualquiera puede leer los talleres', async () => {
    await assertSucceeds(getDocs(collection(anonimo(), 'workshops')));
  });

  it('cualquiera puede leer sesiones, productos y preguntas frecuentes', async () => {
    const db = anonimo();
    await assertSucceeds(getDocs(collection(db, 'sessions')));
    await assertSucceeds(getDocs(collection(db, 'products')));
    await assertSucceeds(getDocs(collection(db, 'faqs')));
  });

  it('un anónimo no puede modificar el catálogo', async () => {
    await assertFails(addDoc(collection(anonimo(), 'workshops'), { titulo: 'Colado' }));
  });

  it('una cuenta sin el claim de admin tampoco puede', async () => {
    await assertFails(addDoc(collection(sinClaim(), 'workshops'), { titulo: 'Colado' }));
  });

  it('una admin sí puede', async () => {
    await assertSucceeds(
      addDoc(collection(admin(), 'workshops'), { titulo: 'Cerámica inicial', activo: true }),
    );
  });
});

describe('Reservas · alta pública', () => {
  it('acepta una reserva bien formada', async () => {
    await assertSucceeds(addDoc(collection(anonimo(), 'bookings'), reservaValida()));
  });

  it('rechaza que llegue ya confirmada', async () => {
    await assertFails(
      addDoc(collection(anonimo(), 'bookings'), reservaValida({ status: 'confirmada' })),
    );
  });

  it('rechaza notas internas rellenas desde fuera', async () => {
    await assertFails(
      addDoc(collection(anonimo(), 'bookings'), reservaValida({ notasInternas: 'colado' })),
    );
  });

  it('rechaza campos que no están en el esquema', async () => {
    await assertFails(
      addDoc(collection(anonimo(), 'bookings'), reservaValida({ descuento: 100 })),
    );
  });

  it('rechaza un correo con formato inválido', async () => {
    await assertFails(addDoc(collection(anonimo(), 'bookings'), reservaValida({ email: 'ana' })));
  });

  it('rechaza un nombre vacío', async () => {
    await assertFails(addDoc(collection(anonimo(), 'bookings'), reservaValida({ nombre: '' })));
  });

  it('rechaza un número de personas absurdo', async () => {
    await assertFails(addDoc(collection(anonimo(), 'bookings'), reservaValida({ nPersonas: 500 })));
    await assertFails(addDoc(collection(anonimo(), 'bookings'), reservaValida({ nPersonas: 0 })));
  });

  it('rechaza una fecha de creación inventada', async () => {
    await assertFails(
      addDoc(collection(anonimo(), 'bookings'), reservaValida({ createdAt: new Date(2020, 0, 1) })),
    );
  });
});

describe('Reservas · lo que no puede hacer un visitante', () => {
  before(async () => {
    await entorno.withSecurityRulesDisabled(async (contexto) => {
      await setDoc(doc(contexto.firestore(), 'bookings/reserva-existente'), {
        ...reservaValida(),
        createdAt: new Date(),
      });
    });
  });

  it('no puede leer las reservas: son datos personales de otras clientas', async () => {
    await assertFails(getDocs(collection(anonimo(), 'bookings')));
    await assertFails(getDoc(doc(anonimo(), 'bookings/reserva-existente')));
  });

  it('no puede confirmarse la plaza a sí mismo', async () => {
    await assertFails(
      updateDoc(doc(anonimo(), 'bookings/reserva-existente'), { status: 'confirmada' }),
    );
  });

  it('no puede borrar una reserva', async () => {
    await assertFails(deleteDoc(doc(anonimo(), 'bookings/reserva-existente')));
  });

  it('una admin sí puede leerla y cambiarla', async () => {
    await assertSucceeds(getDoc(doc(admin(), 'bookings/reserva-existente')));
    await assertSucceeds(
      updateDoc(doc(admin(), 'bookings/reserva-existente'), { notasInternas: 'Llamada hecha' }),
    );
  });
});

describe('Solicitudes de presupuesto', () => {
  it('acepta una solicitud bien formada', async () => {
    await assertSucceeds(addDoc(collection(anonimo(), 'requests'), solicitudValida()));
  });

  it('rechaza un tipo que no existe', async () => {
    await assertFails(
      addDoc(collection(anonimo(), 'requests'), solicitudValida({ tipo: 'inventado' })),
    );
  });

  it('rechaza que llegue ya cerrada', async () => {
    await assertFails(
      addDoc(collection(anonimo(), 'requests'), solicitudValida({ status: 'cerrada' })),
    );
  });

  it('no se pueden leer desde fuera', async () => {
    await assertFails(getDocs(collection(anonimo(), 'requests')));
  });
});

describe('Colecciones internas', () => {
  it('las vacaciones no son públicas: llevan notas internas', async () => {
    await assertFails(getDocs(collection(anonimo(), 'vacations')));
    await assertSucceeds(getDocs(collection(admin(), 'vacations')));
  });

  it('el espejo de cierres sí lo es', async () => {
    await assertSucceeds(getDoc(doc(anonimo(), 'settings/cierres')));
  });

  it('nadie puede escribir en la cola de correo, ni siquiera una admin', async () => {
    await assertFails(addDoc(collection(anonimo(), 'mail'), { to: ['a@b.com'] }));
    await assertFails(addDoc(collection(admin(), 'mail'), { to: ['a@b.com'] }));
  });

  it('la ficha de administradora no se puede tocar desde el cliente', async () => {
    await assertFails(setDoc(doc(admin(), `admins/${UID_OTRA}`), { rol: 'admin', activo: true }));
  });

  it('las plantillas de email solo las ve una admin', async () => {
    await assertFails(getDocs(collection(anonimo(), 'templates')));
    await assertSucceeds(getDocs(collection(admin(), 'templates')));
  });
});

describe('Colecciones no declaradas', () => {
  it('se deniegan por defecto', async () => {
    await assertFails(addDoc(collection(anonimo(), 'coleccion-inventada'), { x: 1 }));
    await assertFails(getDocs(collection(admin(), 'coleccion-inventada')));
  });
});

describe('Contadores de plazas · lo que ni una admin puede tocar', () => {
  before(async () => {
    await entorno.withSecurityRulesDisabled(async (contexto) => {
      const db = contexto.firestore();

      await setDoc(doc(db, 'sessions/sesion-cupo'), {
        workshopId: 'taller-1',
        fechaInicio: new Date(),
        fechaFin: new Date(),
        plazasTotales: 8,
        plazasConfirmadas: 3,
        activa: true,
        notasInternas: '',
      });

      await setDoc(doc(db, 'bookings/reserva-confirmada'), {
        ...reservaValida(),
        createdAt: new Date(),
        status: 'confirmada',
        confirmadaAt: new Date(),
      });
    });
  });

  it('una admin puede cambiar las plazas totales de una sesión', async () => {
    await assertSucceeds(updateDoc(doc(admin(), 'sessions/sesion-cupo'), { plazasTotales: 10 }));
  });

  it('pero no puede tocar las plazas confirmadas a mano', async () => {
    await assertFails(
      updateDoc(doc(admin(), 'sessions/sesion-cupo'), { plazasConfirmadas: 0 }),
    );
  });

  it('una sesión nueva no puede nacer con plazas ya confirmadas', async () => {
    await assertFails(
      addDoc(collection(admin(), 'sessions'), {
        workshopId: 'taller-1',
        fechaInicio: new Date(),
        fechaFin: new Date(),
        plazasTotales: 8,
        plazasConfirmadas: 5,
        activa: true,
        notasInternas: '',
      }),
    );
  });

  it('una admin puede escribir notas en una reserva', async () => {
    await assertSucceeds(
      updateDoc(doc(admin(), 'bookings/reserva-confirmada'), { notasInternas: 'Ha pagado' }),
    );
  });

  it('pero no puede cambiarle el estado sin pasar por confirmBooking', async () => {
    await assertFails(
      updateDoc(doc(admin(), 'bookings/reserva-confirmada'), { status: 'cancelada' }),
    );
  });

  it('ni borrar una reserva confirmada, que dejaría las plazas ocupadas', async () => {
    await assertFails(deleteDoc(doc(admin(), 'bookings/reserva-confirmada')));
  });

  it('una reserva pendiente sí se puede borrar', async () => {
    await entorno.withSecurityRulesDisabled(async (contexto) => {
      await setDoc(doc(contexto.firestore(), 'bookings/reserva-pendiente'), {
        ...reservaValida(),
        createdAt: new Date(),
      });
    });

    await assertSucceeds(deleteDoc(doc(admin(), 'bookings/reserva-pendiente')));
  });
});

describe('Coherencia del propio test', () => {
  it('la reserva de referencia tiene exactamente los campos del esquema', () => {
    const reglas = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
    const permitidos = reglas
      .split('match /bookings/{id}')[1]
      .split('hasOnly([')[1]
      .split('])')[0]
      .match(/'(\w+)'/g)
      .map((x) => x.replaceAll("'", ''));

    assert.deepEqual(Object.keys(reservaValida()).sort(), permitidos.sort());
  });
});
