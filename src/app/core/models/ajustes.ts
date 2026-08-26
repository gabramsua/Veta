export interface SeccionesActivas {
  faq: boolean;
  talleres: boolean;
  bonos: boolean;
  liveart: boolean;
  blog: boolean;
  reservas: boolean;
}

export interface RedesSociales {
  instagram: string;
  pinterest: string;
  facebook: string;
  tiktok: string;
}

export interface DatosContacto {
  email: string;
  telefono: string;
  direccion: string;
  horario: string;
}

export interface AvisoGlobal {
  activo: boolean;
  texto: string;
}

export interface Ajustes {
  secciones: SeccionesActivas;
  redes: RedesSociales;
  contacto: DatosContacto;
  avisoGlobal: AvisoGlobal;
}

export const AJUSTES_POR_DEFECTO: Ajustes = {
  secciones: {
    faq: true,
    talleres: true,
    bonos: true,
    liveart: true,
    blog: false,
    reservas: true,
  },
  redes: { instagram: '', pinterest: '', facebook: '', tiktok: '' },
  contacto: { email: '', telefono: '', direccion: 'Sevilla', horario: '' },
  avisoGlobal: { activo: false, texto: '' },
};
