import { Timestamp } from '@angular/fire/firestore';

export type Ordenable = { orden: number };
export type Activable = { activo: boolean };

/**
 * Dónde se coloca una imagen respecto al texto de su bloque.
 *
 * `izquierda` y `derecha` hacen que el texto la rodee; `completa` la deja a
 * todo el ancho, con el texto debajo. Es el comportamiento de siempre, así que
 * es el valor por defecto.
 */
export type PosicionImagen = 'completa' | 'izquierda' | 'derecha';

export const POSICIONES_IMAGEN: { valor: PosicionImagen; etiqueta: string }[] = [
  { valor: 'completa', etiqueta: 'Ancho completo, el texto debajo' },
  { valor: 'derecha', etiqueta: 'A la derecha, el texto la rodea' },
  { valor: 'izquierda', etiqueta: 'A la izquierda, el texto la rodea' },
];

export interface Imagen {
  url: string;
  storagePath: string;
  alt: string;
  orden: number;
  // Dimensiones del original. Sirven para reservar el hueco antes de que la
  // imagen cargue y evitar que la página dé un salto. Opcionales porque las
  // imágenes subidas antes de la fase 7 no las tienen.
  width?: number | null;
  height?: number | null;
  /**
   * Colocación respecto al texto. Va aquí y no en un mapa aparte —como sí pasa
   * con `estilos`— porque es una propiedad de esta colocación concreta de la
   * imagen, igual que `orden` y `alt`, no del archivo de la biblioteca.
   *
   * Opcional: las imágenes guardadas antes de esto no lo tienen y se pintan a
   * ancho completo, que es como se veían.
   */
  posicion?: PosicionImagen;
}

export interface Seo {
  title: string;
  description: string;
  ogImage?: string;
}

export type FechaFs = Timestamp;
