import { CategoriaProducto } from '../models';

// La dirección de cada subsección. Se mantiene aparte del nombre visible para
// poder cambiar el título sin romper enlaces ya compartidos.
export const SLUG_POR_CATEGORIA: Record<CategoriaProducto, string> = {
  invitaciones: 'invitaciones',
  seating: 'seating',
  minutas: 'minutas',
  marcasitios: 'marcasitios',
  paipai: 'paipai',
  misal: 'misal',
  'libro-testigos': 'libro-de-testigos',
  portalianzas: 'portalianzas',
  pack: 'pack',
};

export const CATEGORIA_POR_SLUG: Record<string, CategoriaProducto> = Object.fromEntries(
  Object.entries(SLUG_POR_CATEGORIA).map(([categoria, slug]) => [slug, categoria]),
) as Record<string, CategoriaProducto>;

/**
 * El documento de `pages` donde vive el contenido editable de cada subsección.
 *
 * Existe para que el slug lo calcule **un solo sitio**. Cuando lo calculaban
 * dos, pasó lo que tenía que pasar: la categoría `libro-testigos` tiene la
 * dirección `libro-de-testigos`, el catálogo de textos usaba la dirección y la
 * página pública usaba la categoría, así que Carmen guardaba en un documento y
 * la web leía otro. Guardaba bien, no daba error y no se veía nada.
 */
export function slugPaginaPapeleria(categoria: CategoriaProducto): string {
  return `papeleria-${SLUG_POR_CATEGORIA[categoria]}`;
}

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
  { valor: 'misal', etiqueta: 'Misal' },
  { valor: 'libro-testigos', etiqueta: 'Libro de testigos' },
  { valor: 'portalianzas', etiqueta: 'Portalianzas' },
  { valor: 'pack', etiqueta: 'Pack completo' },
];

export const ETIQUETA_POR_PIEZA: Record<string, string> = Object.fromEntries(
  PIEZAS_PAPELERIA.map(({ valor, etiqueta }) => [valor, etiqueta]),
);

/**
 * Cada subsección alimenta su propia galería del portfolio.
 *
 * `pack` apuntaba a `invitaciones`, y eso hacía que la galería del Pack
 * completo fueran en realidad las fotos de Invitaciones: no se podían quitar de
 * una página sin vaciarlas de la otra. Ahora cada subsección tiene su sección,
 * con el mismo nombre que la categoría, y la correspondencia es uno a uno.
 */
export const SECCION_PORTFOLIO_POR_CATEGORIA: Record<CategoriaProducto, string> = {
  invitaciones: 'invitaciones',
  seating: 'seating',
  minutas: 'minutas',
  marcasitios: 'marcasitios',
  paipai: 'paipai',
  misal: 'misal',
  'libro-testigos': 'libro-testigos',
  portalianzas: 'portalianzas',
  pack: 'pack',
};
