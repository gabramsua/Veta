import { Timestamp } from '@angular/fire/firestore';

// Firestore guarda Timestamp; los <input type="datetime-local"> hablan de
// cadenas en hora local. Estas dos funciones son el único puente entre ambos.
export function aValorInput(fecha: Timestamp | null | undefined): string {
  if (!fecha) return '';

  const d = fecha.toDate();
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function desdeValorInput(valor: string): Timestamp {
  return Timestamp.fromDate(new Date(valor));
}

export function formatearFecha(fecha: Timestamp | null | undefined): string {
  if (!fecha) return '—';

  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha.toDate());
}

export function seSolapan(
  inicioA: Timestamp,
  finA: Timestamp,
  inicioB: Timestamp,
  finB: Timestamp,
): boolean {
  return inicioA.toMillis() < finB.toMillis() && inicioB.toMillis() < finA.toMillis();
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/**
 * Da formato a una fecha suelta del tipo `2027-06-12`, que es lo que devuelve un
 * `<input type="date">`.
 *
 * Se parte la cadena a mano en vez de pasar por `Date`: `new Date('2027-06-12')`
 * la interpreta como medianoche UTC, y al formatearla en otra zona horaria puede
 * mostrar el día anterior. Una fecha de boda no tiene hora ni huso, así que
 * meter un `Date` por medio solo añade formas de equivocarse.
 *
 * Si la cadena no tiene esa forma se devuelve tal cual: puede ser la respuesta a
 * una pregunta de texto que casualmente parecía una fecha.
 */
export function formatearFechaIso(valor: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim());

  if (!partes) return valor;

  const [, anio, mes, dia] = partes;
  const nombreMes = MESES[Number(mes) - 1];

  if (!nombreMes) return valor;

  return `${Number(dia)} de ${nombreMes} de ${anio}`;
}
