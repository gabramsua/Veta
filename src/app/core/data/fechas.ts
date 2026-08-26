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
