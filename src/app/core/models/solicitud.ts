import { FechaFs } from './comunes';

export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada';
export type EstadoSolicitud = 'nueva' | 'en-curso' | 'respondida' | 'cerrada';
export type TipoSolicitud = 'papeleria' | 'liveart' | 'encargo' | 'contacto';
export type TipoFormulario = TipoSolicitud | 'taller' | 'bono';

export interface Reserva {
  id: string;
  tipo: 'taller' | 'bono';
  sessionId: string | null;
  bonoId: string | null;
  nombre: string;
  email: string;
  telefono: string;
  nPersonas: number;
  respuestas: Record<string, string>;
  status: EstadoReserva;
  createdAt: FechaFs;
  confirmadaAt: FechaFs | null;
  notasInternas: string;
}

export interface Solicitud {
  id: string;
  tipo: TipoSolicitud;
  /**
   * Solo en papelería: qué piezas ha marcado. Vacío en el resto de formularios.
   *
   * Opcional al leer, obligatorio al escribir (`EnvioSolicitud`). Las
   * solicitudes anteriores a este campo siguen en Firestore sin él, y decir aquí
   * que siempre está sería mentirle al compilador justo donde más duele.
   */
  piezas?: string[];
  nombre: string;
  email: string;
  telefono: string;
  respuestas: Record<string, string>;
  status: EstadoSolicitud;
  createdAt: FechaFs;
  notasInternas: string;
}

export type TipoPregunta = 'texto' | 'textarea' | 'opciones' | 'fecha';

export interface PreguntaFormulario {
  id: string;
  formulario: TipoFormulario;
  etiqueta: string;
  tipo: TipoPregunta;
  opciones: string[];
  obligatoria: boolean;
  orden: number;
  activa: boolean;
}
