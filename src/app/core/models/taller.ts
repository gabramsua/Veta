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

export interface Bono {
  id: string;
  categoria: CategoriaTaller;
  titulo: string;
  descripcion: string;
  precioMes: number;
  sesionesMes: number;
  activo: boolean;
  orden: number;
}
