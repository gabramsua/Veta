import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export type Periodo = 'mes' | 'trimestre' | 'ano' | 'doce-meses';

export const PERIODOS: { valor: Periodo; etiqueta: string }[] = [
  { valor: 'mes', etiqueta: 'Este mes' },
  { valor: 'trimestre', etiqueta: 'Últimos 3 meses' },
  { valor: 'ano', etiqueta: 'Este año' },
  { valor: 'doce-meses', etiqueta: 'Últimos 12 meses' },
];

export interface VisitaDia {
  fecha: string;
  paginasVistas: number;
  visitas: number;
}

export interface EstadisticasWeb {
  configurado: boolean;
  /**
   * Identificadores de sitio que alcanza el token, cuando el configurado falta
   * o no devuelve nada. Es la ayuda para acertar sin adivinar.
   */
  sitios: string[];
  porDia: VisitaDia[];
  paginas: { ruta: string; paginasVistas: number }[];
  origenes: { origen: string; paginasVistas: number }[];
}

/**
 * Desde cuándo cuenta cada periodo.
 *
 * «Este mes» y «este año» arrancan en el día 1, que es como lo piensa quien
 * mira la cuenta de resultados. Los otros dos son ventanas móviles hacia atrás
 * desde hoy, que es lo que sirve para comparar temporadas.
 */
export function inicioDelPeriodo(periodo: Periodo, hoy = new Date()): Date {
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  switch (periodo) {
    case 'mes':
      return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    case 'trimestre':
      return new Date(fecha.getFullYear(), fecha.getMonth() - 2, 1);
    case 'ano':
      return new Date(fecha.getFullYear(), 0, 1);
    case 'doce-meses':
      return new Date(fecha.getFullYear() - 1, fecha.getMonth() + 1, 1);
  }
}

/**
 * Fecha en `AAAA-MM-DD` construida a mano.
 *
 * `toISOString()` pasa por UTC, y en España eso adelanta un día las fechas de
 * madrugada en verano. Es el mismo motivo por el que `formatearFechaIso` parte
 * la cadena en vez de construir un `Date`.
 */
export function aFechaIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private readonly functions = inject(Functions);

  /**
   * Las visitas las sirve una Function porque el token de Cloudflare no puede
   * estar en el navegador: da acceso de lectura a toda la cuenta.
   */
  async web(desde: Date, hasta: Date): Promise<EstadisticasWeb> {
    const fn = httpsCallable<{ desde: string; hasta: string }, EstadisticasWeb>(
      this.functions,
      'estadisticasWeb',
    );

    const respuesta = await fn({ desde: aFechaIso(desde), hasta: aFechaIso(hasta) });
    return respuesta.data;
  }
}
