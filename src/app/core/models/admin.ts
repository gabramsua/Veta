import { FechaFs } from './comunes';

export interface Admin {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin';
  activo: boolean;
  createdAt: FechaFs;
}
