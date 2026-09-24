import { FechaFs } from './comunes';

export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada';
export type EstadoSolicitud = 'nueva' | 'en-curso' | 'respondida' | 'cerrada';
/**
 * `evento` son los talleres privados: despedidas, cumpleaños y regalos.
 *
 * No es una reserva aunque salga desde Talleres. No hay fecha en el calendario
 * ni plazas que descontar: son ellas quienes montan la sesión a medida, así que
 * el flujo es el de un presupuesto y acaba en `requests`.
 */
export type TipoSolicitud = 'papeleria' | 'liveart' | 'encargo' | 'evento' | 'contacto';
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
  /**
   * De dónde salió la reserva.
   *
   * Las de la web no lo traen —las reglas de Firestore no admiten el campo en
   * el alta pública—, así que ausente significa `'web'`. Lo escribe solo
   * `crearReservaManual`, y sirve para dos cosas: que el disparador de correo
   * no mande el «hemos recibido tu solicitud» a quien nunca solicitó nada, y
   * que en la lista se vea de un vistazo cuál apuntó Carmen a mano.
   */
  origen?: 'web' | 'panel';
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
