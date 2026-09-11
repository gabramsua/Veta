/**
 * ¿Este HTML del editor tiene algo que enseñar?
 *
 * Jodit no devuelve una cadena vacía al borrar el contenido: deja el párrafo que
 * contenía el cursor, normalmente `<p><br></p>` o `<p>&nbsp;</p>`. Eso es una
 * cadena con longitud, así que un `@if (texto)` la da por buena y pinta una
 * sección con su padding y un párrafo vacío dentro: el hueco enorme que se veía
 * entre la cabecera y el contenido siguiente.
 *
 * Las imágenes y los vídeos sí cuentan como contenido aunque no aporten texto.
 */
const ETIQUETAS_CON_PESO = /<(img|iframe|video|figure|table|hr)\b/i;

export function tieneContenido(html: string | null | undefined): boolean {
  if (!html) return false;
  if (ETIQUETAS_CON_PESO.test(html)) return true;

  return textoPlano(html, Number.MAX_SAFE_INTEGER).length > 0;
}

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
