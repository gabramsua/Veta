export const SECCIONES_PORTFOLIO = [
  { valor: 'invitaciones', etiqueta: 'Invitaciones' },
  { valor: 'seating', etiqueta: 'Seating plan y meseros' },
  { valor: 'minutas', etiqueta: 'Minutas' },
  { valor: 'marcasitios', etiqueta: 'Marcasitios' },
  { valor: 'paipai', etiqueta: 'PaiPai' },
  { valor: 'misal', etiqueta: 'Misal' },
  { valor: 'libro-testigos', etiqueta: 'Libro de testigos' },
  { valor: 'portalianzas', etiqueta: 'Portalianzas' },
  { valor: 'pack', etiqueta: 'Pack completo' },
  { valor: 'liveart', etiqueta: 'Live art' },
  { valor: 'acuarelas', etiqueta: 'Acuarelas y encargos' },
  { valor: 'talleres', etiqueta: 'Talleres' },
] as const;

export type SeccionPortfolio = (typeof SECCIONES_PORTFOLIO)[number]['valor'];

export function etiquetaSeccion(valor: string): string {
  return SECCIONES_PORTFOLIO.find((s) => s.valor === valor)?.etiqueta ?? valor;
}
