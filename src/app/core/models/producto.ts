import { Imagen } from './comunes';

export type CategoriaProducto =
  | 'invitaciones'
  | 'seating'
  | 'minutas'
  | 'marcasitios'
  | 'paipai'
  | 'pack';

export const CATEGORIAS_PRODUCTO: Record<CategoriaProducto, string> = {
  invitaciones: 'Invitaciones',
  seating: 'Seating plan y meseros',
  minutas: 'Minutas',
  marcasitios: 'Marcasitios',
  paipai: 'PaiPai',
  pack: 'Pack completo',
};

export interface Producto {
  id: string;
  categoria: CategoriaProducto;
  titulo: string;
  descripcion: string;
  precioDesde: number;
  unidad: string;
  imagenes: Imagen[];
  destacado: boolean;
  orden: number;
  activo: boolean;
}

export interface PiezaPortfolio {
  id: string;
  seccion: string;
  titulo: string;
  imagen: Imagen;
  orden: number;
  activo: boolean;
}
