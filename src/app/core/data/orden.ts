export interface ConOrden {
  id: string;
  orden: number;
}

// Devuelve solo los elementos cuyo `orden` cambia, para no escribir de más.
export function intercambiar<T extends ConOrden>(
  lista: readonly T[],
  indice: number,
  direccion: -1 | 1,
): { id: string; orden: number }[] {
  const destino = indice + direccion;

  if (destino < 0 || destino >= lista.length) return [];

  const a = lista[indice];
  const b = lista[destino];

  return [
    { id: a.id, orden: b.orden },
    { id: b.id, orden: a.orden },
  ];
}

export function siguienteOrden(lista: readonly ConOrden[]): number {
  return lista.reduce((max, item) => Math.max(max, item.orden), -1) + 1;
}
