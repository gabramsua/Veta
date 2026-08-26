import { Injectable, inject } from '@angular/core';
import { addDoc, collection, limit, orderBy, serverTimestamp } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable } from 'rxjs';

import { ColeccionBase } from './firestore-base';
import { Reserva, Solicitud, TipoSolicitud } from '../models';

export interface EnvioSolicitud {
  tipo: TipoSolicitud;
  nombre: string;
  email: string;
  telefono: string;
  respuestas: Record<string, string>;
}

export interface EnvioReserva {
  tipo: 'taller' | 'bono';
  sessionId: string | null;
  bonoId: string | null;
  nombre: string;
  email: string;
  telefono: string;
  nPersonas: number;
  respuestas: Record<string, string>;
}

/**
 * Altas públicas. El documento se escribe con exactamente los campos que las
 * reglas de Firestore aceptan: cualquier campo de más hace que la escritura se
 * rechace entera, así que no se usa `ColeccionBase.crear`, que añade `createdAt`
 * por su cuenta.
 */
@Injectable({ providedIn: 'root' })
export class SolicitudesService extends ColeccionBase<Solicitud> {
  protected readonly ruta = 'requests';

  listarRecientes(cuantas = 25): Observable<Solicitud[]> {
    return this.listar(orderBy('createdAt', 'desc'), limit(cuantas));
  }

  async enviar(datos: EnvioSolicitud): Promise<string> {
    const referencia = await addDoc(collection(this.firestore, 'requests'), {
      tipo: datos.tipo,
      nombre: datos.nombre,
      email: datos.email,
      telefono: datos.telefono,
      respuestas: datos.respuestas,
      status: 'nueva',
      createdAt: serverTimestamp(),
      notasInternas: '',
    });

    return referencia.id;
  }
}

@Injectable({ providedIn: 'root' })
export class ReservasService extends ColeccionBase<Reserva> {
  protected readonly ruta = 'bookings';

  private readonly functions = inject(Functions);

  listarRecientes(cuantas = 25): Observable<Reserva[]> {
    return this.listar(orderBy('createdAt', 'desc'), limit(cuantas));
  }

  // Cambiar el estado mueve plazas, así que va por Function en transacción.
  async cambiarEstado(bookingId: string, status: 'confirmada' | 'cancelada'): Promise<void> {
    const fn = httpsCallable<{ bookingId: string; status: string }, { ok: boolean }>(
      this.functions,
      'confirmBooking',
    );

    await fn({ bookingId, status });
  }

  async enviar(datos: EnvioReserva): Promise<string> {
    const referencia = await addDoc(collection(this.firestore, 'bookings'), {
      tipo: datos.tipo,
      sessionId: datos.sessionId,
      bonoId: datos.bonoId,
      nombre: datos.nombre,
      email: datos.email,
      telefono: datos.telefono,
      nPersonas: datos.nPersonas,
      respuestas: datos.respuestas,
      status: 'pendiente',
      createdAt: serverTimestamp(),
      confirmadaAt: null,
      notasInternas: '',
    });

    return referencia.id;
  }
}
