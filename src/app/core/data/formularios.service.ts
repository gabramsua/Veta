import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { orderBy } from '@angular/fire/firestore';

import { ColeccionBase } from './firestore-base';
import { PreguntaFormulario, TipoFormulario } from '../models';

export const FORMULARIOS: { valor: TipoFormulario; etiqueta: string; descripcion: string }[] = [
  { valor: 'taller', etiqueta: 'Reserva de taller', descripcion: 'Cuando alguien pide plaza en una sesión.' },
  { valor: 'bono', etiqueta: 'Bono mensual', descripcion: 'Solicitud de bono de cerámica, pintura o infantil.' },
  { valor: 'papeleria', etiqueta: 'Papelería de bodas', descripcion: 'Presupuesto de invitaciones, seating, minutas…' },
  { valor: 'liveart', etiqueta: 'Live art', descripcion: 'Acuarela en directo para un evento.' },
  { valor: 'encargo', etiqueta: 'Acuarelas y encargos', descripcion: 'Piezas por encargo.' },
  { valor: 'contacto', etiqueta: 'Contacto general', descripcion: 'El formulario de la página de contacto.' },
];

export function etiquetaFormulario(valor: TipoFormulario): string {
  return FORMULARIOS.find((f) => f.valor === valor)?.etiqueta ?? valor;
}

@Injectable({ providedIn: 'root' })
export class FormulariosService extends ColeccionBase<PreguntaFormulario> {
  protected readonly ruta = 'formQuestions';

  todas(): Observable<PreguntaFormulario[]> {
    return this.listar(orderBy('orden'));
  }

  // Para la parte pública: solo las activas de un formulario.
  activasDe(formulario: TipoFormulario): Observable<PreguntaFormulario[]> {
    return this.listar(orderBy('orden')).pipe(
      map((lista) => lista.filter((p) => p.activa && p.formulario === formulario)),
    );
  }
}
