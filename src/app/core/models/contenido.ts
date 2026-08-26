import { FechaFs, Imagen, Seo } from './comunes';

export interface Faq {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria: string;
  orden: number;
  activa: boolean;
}

export interface Frase {
  id: string;
  texto: string;
  autor: string;
  contexto: string;
  orden: number;
  activa: boolean;
}

export interface Medio {
  id: string;
  nombre: string;
  url: string;
  storagePath: string;
  tipo: 'imagen' | 'pdf';
  categoriaId: string | null;
  alt: string;
  bytes: number;
  width: number | null;
  height: number | null;
  createdAt: FechaFs;
}

export interface CategoriaMedio {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
}

export interface Pagina {
  id: string;
  textos: Record<string, string>;
  // Las imágenes propias de la página: portada, retratos, bloques ilustrados.
  // Las galerías siguen viviendo en `portfolio`.
  imagenes: Record<string, Imagen>;
  seo: Seo;
}

export interface Vacaciones {
  id: string;
  adminUid: string;
  fechaInicio: FechaFs;
  fechaFin: FechaFs;
  workshopIds: string[];
  nota: string;
  createdAt: FechaFs;
}

export interface PlantillaEmail {
  id: string;
  subject: string;
  html: string;
  descripcion: string;
}
