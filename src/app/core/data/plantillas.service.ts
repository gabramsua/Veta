import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable } from 'rxjs';

import { ColeccionBase } from './firestore-base';
import { PlantillaEmail } from '../models';

export const PLANTILLAS_CONOCIDAS: { id: string; nombre: string; cuando: string; variables: string[] }[] = [
  {
    id: 'solicitud-veta',
    nombre: 'Aviso interno · presupuesto',
    cuando: 'Os llega a vosotras cuando alguien pide un presupuesto.',
    variables: ['tipo', 'piezas', 'nombre', 'email', 'telefono', 'respuestasHtml'],
  },
  {
    id: 'solicitud-cliente',
    nombre: 'Acuse de recibo · presupuesto',
    cuando: 'Le llega a la clienta al pedir un presupuesto, con un resumen de lo que ha pedido.',
    variables: ['tipo', 'piezas', 'nombre', 'email', 'telefono', 'respuestasHtml'],
  },
  {
    id: 'reserva-veta',
    nombre: 'Aviso interno · reserva',
    cuando: 'Os llega a vosotras cuando alguien pide plaza en un taller o un bono.',
    variables: ['taller', 'etiqueta', 'fecha', 'nombre', 'email', 'telefono', 'nPersonas', 'respuestasHtml'],
  },
  {
    id: 'reserva-cliente',
    nombre: 'Acuse de recibo · reserva',
    cuando: 'Le llega a la clienta al solicitar plaza, con un resumen. Todavía no está confirmada.',
    variables: ['nombre', 'taller', 'etiqueta', 'fecha', 'nPersonas', 'email', 'telefono', 'respuestasHtml'],
  },
  {
    id: 'reserva-confirmada',
    nombre: 'Reserva confirmada',
    cuando: 'Le llega a la clienta cuando confirmáis su plaza desde el panel.',
    variables: ['nombre', 'taller', 'etiqueta', 'fecha', 'nPersonas', 'importe'],
  },
  {
    id: 'reserva-cancelada',
    nombre: 'Reserva cancelada',
    cuando: 'Le llega a la clienta si canceláis su reserva.',
    variables: ['nombre', 'taller', 'etiqueta'],
  },
];

@Injectable({ providedIn: 'root' })
export class PlantillasService extends ColeccionBase<PlantillaEmail> {
  protected readonly ruta = 'templates';

  private readonly functions = inject(Functions);

  todas(): Observable<PlantillaEmail[]> {
    return this.listar();
  }

  /**
   * Las plantillas de serie, tal y como están en el código de las Functions.
   *
   * Se piden al servidor en vez de tenerlas aquí para que el texto exista en un
   * único sitio. Si se copiara al cliente, la que se muestra en el editor y la
   * que se envía de verdad se separarían al primer cambio.
   */
  async porDefecto(): Promise<PlantillaEmail[]> {
    const fn = httpsCallable<void, PlantillaEmail[]>(this.functions, 'getPlantillasPorDefecto');
    const respuesta = await fn();

    return respuesta.data ?? [];
  }

  async guardar(id: string, subject: string, html: string, descripcion: string): Promise<void> {
    await this.crearConId(id, { subject, html, descripcion } as Omit<PlantillaEmail, 'id'>);
  }
}
