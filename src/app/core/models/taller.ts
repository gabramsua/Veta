import { FechaFs, Imagen } from './comunes';

export type CategoriaTaller = 'ceramica' | 'pintura' | 'infantil' | 'eventos';

export const CATEGORIAS_TALLER: Record<CategoriaTaller, string> = {
  ceramica: 'Cerámica',
  pintura: 'Pintura',
  infantil: 'Infantil',
  eventos: 'Eventos privados',
};

export interface Taller {
  id: string;
  slug: string;
  categoria: CategoriaTaller;
  titulo: string;
  descripcion: string;
  precio: number;
  duracionMin: number;
  imagenes: Imagen[];
  activo: boolean;
  orden: number;
}

export interface Sesion {
  id: string;
  workshopId: string;
  fechaInicio: FechaFs;
  fechaFin: FechaFs;
  plazasTotales: number;
  plazasConfirmadas: number;
  activa: boolean;
  notasInternas: string;
}

/**
 * Las categorías de un bono no son las de un taller.
 *
 * Un bono no da acceso a eventos privados —esos son a medida y se presupuestan
 * aparte—, y en cambio existe «mixto», que es el caso más común: quien compra
 * un bono suele querer ir a lo que le apetezca cada semana.
 */
export type CategoriaBono = 'ceramica' | 'pintura' | 'infantil' | 'mixto';

export const CATEGORIAS_BONO: Record<CategoriaBono, string> = {
  mixto: 'Mixto · cualquier taller',
  ceramica: 'Cerámica',
  pintura: 'Pintura',
  infantil: 'Infantil',
};

export interface Bono {
  id: string;
  categoria: CategoriaBono;
  titulo: string;
  descripcion: string;
  // Precio del bono completo, no mensual.
  precio: number;
  sesionesMes: number;
  activo: boolean;
  orden: number;
}
