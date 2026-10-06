export interface ImagenDelTexto {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface TextoConImagen {
  imagen: ImagenDelTexto | null;
  /** El HTML sin esa imagen, para pintarlo aparte. */
  texto: string;
}

const IMG = /<img\b[^>]*>/i;
const ATRIBUTO = (nombre: string) => new RegExp(`\\b${nombre}\\s*=\\s*"([^"]*)"`, 'i');

/**
 * Saca la primera imagen de un texto de Jodit para poder colocarla por layout.
 *
 * Existe porque `float` no sirve aquí: un elemento flotado solo lo rodea el
 * contenido que va **después** en el HTML, y Carmen inserta la foto donde tiene
 * el cursor, que casi siempre es al final. Flotando la última imagen no se
 * rodea nada: queda pegada a la derecha con un hueco enorme encima.
 *
 * Al separarla, la tarjeta decide dónde va —una columna a la derecha— sin
 * depender de en qué punto del texto la pegara.
 *
 * Es una expresión regular sobre HTML, que en general es mala idea. Aquí se
 * sostiene porque el HTML no es arbitrario: lo produce nuestro propio botón del
 * editor, siempre como una etiqueta `img` simple con atributos entre comillas
 * dobles. Si un día se permite pegar HTML de fuera, esto hay que rehacerlo con
 * un analizador de verdad.
 */
export function separarPrimeraImagen(html: string | null | undefined): TextoConImagen {
  if (!html) return { imagen: null, texto: '' };

  const etiqueta = IMG.exec(html);
  if (!etiqueta) return { imagen: null, texto: html };

  const leer = (nombre: string) => ATRIBUTO(nombre).exec(etiqueta[0])?.[1] ?? '';
  const src = leer('src');

  if (!src) return { imagen: null, texto: html };

  const numero = (valor: string) => {
    const n = Number.parseInt(valor, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  return {
    imagen: {
      src,
      alt: leer('alt'),
      width: numero(leer('width')),
      height: numero(leer('height')),
    },
    // Jodit suele envolver la imagen en su propio párrafo. Si al quitarla ese
    // párrafo se queda vacío, se va con ella: si no, deja un hueco en blanco.
    texto: html.replace(etiqueta[0], '').replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, ''),
  };
}
