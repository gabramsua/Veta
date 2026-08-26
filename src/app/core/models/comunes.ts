import { Timestamp } from '@angular/fire/firestore';

export type Ordenable = { orden: number };
export type Activable = { activo: boolean };

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
}

export interface Seo {
  title: string;
  description: string;
  ogImage?: string;
}

export type FechaFs = Timestamp;
