import { CategoriaProducto } from '../models';

// La dirección de cada subsección. Se mantiene aparte del nombre visible para
// poder cambiar el título sin romper enlaces ya compartidos.
export const SLUG_POR_CATEGORIA: Record<CategoriaProducto, string> = {
  invitaciones: 'invitaciones',
  seating: 'seating',
  minutas: 'minutas',
  marcasitios: 'marcasitios',
  paipai: 'paipai',
  pack: 'pack',
};

export const CATEGORIA_POR_SLUG: Record<string, CategoriaProducto> = Object.fromEntries(
  Object.entries(SLUG_POR_CATEGORIA).map(([categoria, slug]) => [slug, categoria]),
) as Record<string, CategoriaProducto>;

/**
 * Las piezas que se pueden pedir en el formulario de papelería.
 *
 * Una boda rara vez encarga una sola cosa, así que el formulario deja marcar
 * varias. La que corresponde a la página desde la que se llegó viene marcada de
 * antemano, pero se puede cambiar: quien entra por «Minutas» acaba pidiendo
 * también los marcasitios más veces de las que no.
 */
export const PIEZAS_PAPELERIA: { valor: CategoriaProducto; etiqueta: string }[] = [
  { valor: 'invitaciones', etiqueta: 'Invitaciones' },
  { valor: 'seating', etiqueta: 'Seating plan y meseros' },
  { valor: 'minutas', etiqueta: 'Minutas' },
  { valor: 'marcasitios', etiqueta: 'Marcasitios' },
  { valor: 'paipai', etiqueta: 'PaiPai' },
  { valor: 'pack', etiqueta: 'Pack completo' },
];

export const ETIQUETA_POR_PIEZA: Record<string, string> = Object.fromEntries(
  PIEZAS_PAPELERIA.map(({ valor, etiqueta }) => [valor, etiqueta]),
);

// Cada subsección alimenta su propia galería del portfolio.
export const SECCION_PORTFOLIO_POR_CATEGORIA: Record<CategoriaProducto, string> = {
  invitaciones: 'invitaciones',
  seating: 'seating',
  minutas: 'minutas',
  marcasitios: 'marcasitios',
  paipai: 'paipai',
  pack: 'invitaciones',
};
