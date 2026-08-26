import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ColeccionBase } from './firestore-base';
import { PlantillaEmail } from '../models';

export const PLANTILLAS_CONOCIDAS: { id: string; nombre: string; cuando: string; variables: string[] }[] = [
  {
    id: 'solicitud-veta',
    nombre: 'Aviso interno · presupuesto',
    cuando: 'Os llega a vosotras cuando alguien pide un presupuesto.',
    variables: ['tipo', 'nombre', 'email', 'telefono', 'respuestasHtml'],
  },
  {
    id: 'solicitud-cliente',
    nombre: 'Acuse de recibo · presupuesto',
    cuando: 'Le llega a la clienta al pedir un presupuesto.',
    variables: ['nombre'],
  },
  {
    id: 'reserva-veta',
    nombre: 'Aviso interno · reserva',
    cuando: 'Os llega a vosotras cuando alguien pide plaza en un taller o un bono.',
    variables: ['taller', 'fecha', 'nombre', 'email', 'telefono', 'nPersonas', 'respuestasHtml'],
  },
  {
    id: 'reserva-cliente',
    nombre: 'Acuse de recibo · reserva',
    cuando: 'Le llega a la clienta al solicitar plaza. Todavía no está confirmada.',
    variables: ['nombre', 'taller', 'fecha'],
  },
  {
    id: 'reserva-confirmada',
    nombre: 'Reserva confirmada',
    cuando: 'Le llega a la clienta cuando confirmáis su plaza desde el panel.',
    variables: ['nombre', 'taller', 'fecha', 'nPersonas', 'importe'],
  },
  {
    id: 'reserva-cancelada',
    nombre: 'Reserva cancelada',
    cuando: 'Le llega a la clienta si canceláis su reserva.',
    variables: ['nombre', 'taller'],
  },
];

@Injectable({ providedIn: 'root' })
export class PlantillasService extends ColeccionBase<PlantillaEmail> {
  protected readonly ruta = 'templates';

  todas(): Observable<PlantillaEmail[]> {
    return this.listar();
  }

  async guardar(id: string, subject: string, html: string, descripcion: string): Promise<void> {
    await this.crearConId(id, { subject, html, descripcion } as Omit<PlantillaEmail, 'id'>);
  }
}
