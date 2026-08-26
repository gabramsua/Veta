// Las descripciones meta no admiten etiquetas. El contenido de Jodit llega con
// HTML, así que se limpia y se recorta antes de usarlo como descripción.
export function textoPlano(html: string, maxLong = 155): string {
  const limpio = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  if (limpio.length <= maxLong) return limpio;

  const corte = limpio.slice(0, maxLong);
  return `${corte.slice(0, corte.lastIndexOf(' '))}…`;
}
