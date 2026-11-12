import { Imagen } from './comunes';

/**
 * El orden es el del menú público, y mandar lo manda este tipo: cualquier mapa
 * de `CategoriaProducto` que se deje una fuera no compila. Añadir una
 * subsección empieza aquí y el compilador va señalando lo que falta.
 */
export type CategoriaProducto =
  | 'invitaciones'
  | 'seating'
  | 'minutas'
  | 'marcasitios'
  | 'paipai'
  | 'misal'
  | 'libro-testigos'
  | 'portalianzas'
  | 'pack';

export const CATEGORIAS_PRODUCTO: Record<CategoriaProducto, string> = {
  invitaciones: 'Invitaciones',
  seating: 'Seating plan y meseros',
  minutas: 'Minutas',
  marcasitios: 'Marcasitios',
  paipai: 'PaiPai',
  misal: 'Misal',
  'libro-testigos': 'Libro de testigos',
  portalianzas: 'Portalianzas',
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
