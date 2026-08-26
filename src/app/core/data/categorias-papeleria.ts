import { CategoriaProducto } from '../models';

// La dirección de cada subsección. Se mantiene aparte del nombre visible para
// poder cambiar el título sin romper enlaces ya compartidos.
export const SLUG_POR_CATEGORIA: Record<CategoriaProducto, string> = {
  invitaciones: 'invitaciones',
  seating: 'seating',
  minutas: 'minutas',
  marcasitios: 'marcasitios',
  laminas: 'laminas',
  pack: 'pack',
};

export const CATEGORIA_POR_SLUG: Record<string, CategoriaProducto> = Object.fromEntries(
  Object.entries(SLUG_POR_CATEGORIA).map(([categoria, slug]) => [slug, categoria]),
) as Record<string, CategoriaProducto>;

// Cada subsección alimenta su propia galería del portfolio.
export const SECCION_PORTFOLIO_POR_CATEGORIA: Record<CategoriaProducto, string> = {
  invitaciones: 'invitaciones',
  seating: 'seating',
  minutas: 'minutas',
  marcasitios: 'marcasitios',
  laminas: 'laminas',
  pack: 'invitaciones',
};
