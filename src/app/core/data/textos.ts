export type TipoCampo = 'texto' | 'parrafo' | 'rico' | 'imagen';

/** Las tres familias de la marca. Ver §8 de CLAUDE.md. */
export type EstiloTexto = 'titular' | 'cuerpo' | 'eslogan';

export const ESTILOS_TEXTO: { valor: EstiloTexto; etiqueta: string }[] = [
  { valor: 'titular', etiqueta: 'Titular (Bodoni)' },
  { valor: 'cuerpo', etiqueta: 'Texto normal (Karla)' },
  { valor: 'eslogan', etiqueta: 'Letra inglesa (Pinyon)' },
];

export interface CampoPagina {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  pista?: string;
  porDefecto?: string;
  /**
   * Si está, el panel enseña un desplegable para elegir la familia tipográfica
   * y su valor es la que se usa mientras nadie la cambie.
   *
   * Solo se marcan los campos cuya plantilla pública sabe pintar el estilo
   * elegido. Enseñar el selector en un campo que luego lo ignora sería un
   * control que miente, y de esos ya hemos arreglado unos cuantos.
   */
  estiloPorDefecto?: EstiloTexto;
}

/** Un tramo de la página, tal y como se ve al bajar por ella. */
export interface BloquePagina {
  nombre: string;
  ayuda?: string;
  campos: CampoPagina[];
}

/** «Esto también sale en esta página, pero se gestiona en otro sitio». */
export interface EnlaceRelacionado {
  etiqueta: string;
  ruta: string;
  ayuda: string;
}

export interface PaginaEditable {
  slug: string;
  nombre: string;
  ruta: string;
  bloques: BloquePagina[];
  relacionado: EnlaceRelacionado[];
}

/**
 * Qué se puede editar de cada página.
 *
 * El orden de las páginas es el del menú público, y dentro de cada una el orden
 * de los bloques es el de arriba abajo en la pantalla. La idea es que quien lo
 * usa pueda ir bajando por el formulario igual que baja por la web.
 *
 * Se descartó un constructor de bloques genérico: es más flexible, pero
 * convierte el panel en un editor de estructuras. Las usuarias son dos
 * diseñadoras sin perfil técnico. Añadir un hueco cuesta una línea aquí.
 */
export const PAGINAS_EDITABLES: PaginaEditable[] = [
  {
    slug: 'home',
    nombre: 'Portada',
    ruta: '/',
    bloques: [
      {
        nombre: '1 · Imagen de portada',
        ayuda: 'Lo primero que se ve al entrar, a pantalla completa.',
        campos: [
          {
            clave: 'heroImagen',
            etiqueta: 'Imagen de fondo',
            tipo: 'imagen',
            pista: 'Apaisada y con espacio libre abajo a la izquierda, que es donde va el texto. Mínimo 2000 px de ancho.',
          },
          { clave: 'heroAntetitulo', etiqueta: 'Línea pequeña de encima', tipo: 'texto', porDefecto: 'Estudio creativo · Sevilla' },
          {
            clave: 'heroTitulo',
            etiqueta: 'Titular grande',
            tipo: 'parrafo',
            pista: 'Cada línea que escribas aparecerá en un renglón distinto.',
            porDefecto: 'Papel, acuarela\ny manos que crean',
            estiloPorDefecto: 'titular',
          },
        ],
      },
      {
        nombre: '2 · Frase de marca',
        ayuda: 'La frase grande sobre fondo crema, justo debajo de la portada.',
        campos: [
          { clave: 'manifiestoAntetitulo', etiqueta: 'Línea pequeña de encima', tipo: 'texto', porDefecto: 'En Veta creemos que' },
          { clave: 'manifiestoFrase', etiqueta: 'La frase', tipo: 'parrafo', pista: 'Cada línea, un renglón.', porDefecto: 'Lo que se hace despacio\nse queda para siempre', estiloPorDefecto: 'eslogan' },
          { clave: 'manifiestoTexto', etiqueta: 'Texto debajo', tipo: 'parrafo', porDefecto: '' },
        ],
      },
      {
        nombre: '3 · Papelería de bodas',
        ayuda: 'La rejilla con las seis subsecciones de papelería.',
        campos: [
          { clave: 'papeleriaTitulo', etiqueta: 'Título', tipo: 'texto', porDefecto: 'Papelería que cuenta vuestra historia', estiloPorDefecto: 'eslogan' },
          { clave: 'papeleriaTexto', etiqueta: 'Texto', tipo: 'parrafo', porDefecto: 'Cada pieza se diseña a medida. Pídenos presupuesto sin compromiso.' },
        ],
      },
      {
        nombre: '4 · Live art',
        ayuda: 'El bloque a media pantalla con la acuarela en directo.',
        campos: [
          { clave: 'liveartImagen', etiqueta: 'Imagen', tipo: 'imagen', pista: 'Vertical u horizontal, se recorta a la mitad de la pantalla.' },
          { clave: 'liveartTitulo', etiqueta: 'Título', tipo: 'texto', porDefecto: 'Acuarelas en directo', estiloPorDefecto: 'titular' },
          { clave: 'liveartTexto', etiqueta: 'Texto', tipo: 'parrafo', porDefecto: '' },
        ],
      },
      {
        nombre: '5 · Cierre',
        ayuda: 'El último bloque, antes del pie.',
        campos: [
          { clave: 'cierreTitulo', etiqueta: 'Título', tipo: 'texto', porDefecto: 'Nos vemos en el estudio', estiloPorDefecto: 'titular' },
          { clave: 'cierreTexto', etiqueta: 'Texto', tipo: 'parrafo', porDefecto: 'Escríbenos y te contamos disponibilidad, precios y todo lo que necesites saber.' },
        ],
      },
    ],
    relacionado: [
      { etiqueta: 'Piezas destacadas', ruta: '/panel/productos', ayuda: 'Salen las que marques como «Destacar en la portada».' },
      { etiqueta: 'Próximos talleres', ruta: '/panel/sesiones', ayuda: 'Se muestran solas las tres fechas más cercanas con plazas.' },
      { etiqueta: 'Testimonios', ruta: '/panel/frases', ayuda: 'El bloque solo aparece si hay alguno publicado.' },
    ],
  },

  {
    slug: 'quienes-somos',
    nombre: 'Quiénes somos',
    ruta: '/quienes-somos',
    bloques: [
      {
        nombre: '1 · Cabecera',
        campos: [
          { clave: 'entradilla', etiqueta: 'Entradilla', tipo: 'parrafo', porDefecto: 'Carmen y Maripepi, dos diseñadoras que trabajan el papel y la acuarela desde Sevilla.' },
        ],
      },
      {
        nombre: '2 · Frase de marca',
        ayuda: 'Una frase corta, en letra inglesa. Si la dejas vacía, el bloque no aparece.',
        campos: [
          {
            clave: 'esloganFrase',
            etiqueta: 'La frase',
            tipo: 'parrafo',
            pista: 'Cada línea, un renglón. Cuanto más corta, mejor luce.',
            porDefecto: 'Queremos hacer de vuestra historia\nuna obra de arte',
            estiloPorDefecto: 'eslogan',
          },
        ],
      },
      {
        nombre: '3 · Qué es Veta',
        campos: [
          { clave: 'queEsTitulo', etiqueta: 'Título', tipo: 'texto', porDefecto: 'Qué es Veta', estiloPorDefecto: 'titular' },
          { clave: 'queEsImagen', etiqueta: 'Imagen', tipo: 'imagen' },
          { clave: 'queEsTexto', etiqueta: 'Texto', tipo: 'rico', porDefecto: '' },
        ],
      },
      {
        nombre: '4 · Carmen y Maripepi',
        campos: [
          { clave: 'quienesTitulo', etiqueta: 'Título', tipo: 'texto', porDefecto: 'Carmen y Maripepi', estiloPorDefecto: 'titular' },
          { clave: 'quienesImagen', etiqueta: 'Foto', tipo: 'imagen', pista: 'Un retrato de las dos funciona mejor que dos fotos sueltas.' },
          { clave: 'quienesTexto', etiqueta: 'Texto', tipo: 'rico', porDefecto: '' },
        ],
      },
    ],
    relacionado: [],
  },

  {
    slug: 'papeleria-de-bodas',
    nombre: 'Papelería de bodas',
    ruta: '/papeleria-de-bodas',
    bloques: [
      {
        nombre: '1 · Cabecera',
        campos: [
          { clave: 'entradilla', etiqueta: 'Entradilla', tipo: 'parrafo', porDefecto: 'Invitaciones, seating, minutas, marcasitios y láminas. Todo hecho a mano y a medida.' },
          { clave: 'texto', etiqueta: 'Texto de la sección', tipo: 'rico', porDefecto: '' },
        ],
      },
      {
        nombre: '2 · Nota de precios',
        ayuda: 'Aparece bajo la rejilla de subsecciones.',
        campos: [
          { clave: 'notaPrecios', etiqueta: 'Nota', tipo: 'parrafo', porDefecto: 'Los precios son orientativos y varían según acabados, cantidad y plazos. Pídenos presupuesto sin compromiso.' },
        ],
      },
    ],
    relacionado: [
      { etiqueta: 'Modelos y precios', ruta: '/panel/productos', ayuda: 'Cada modelo con su foto, su precio desde y en qué subsección aparece.' },
      { etiqueta: 'Galerías de trabajos', ruta: '/panel/portfolio', ayuda: 'Las fotos que salen al final de cada subsección.' },
    ],
  },

  {
    slug: 'live-art',
    nombre: 'Live art',
    ruta: '/live-art',
    bloques: [
      {
        nombre: '1 · Cabecera',
        campos: [
          { clave: 'entradilla', etiqueta: 'Entradilla', tipo: 'parrafo', porDefecto: 'Acuarelas en directo durante tu celebración. Cada invitado se lleva su ilustración.' },
        ],
      },
      {
        nombre: '2 · Cómo funciona',
        campos: [
          { clave: 'imagen', etiqueta: 'Imagen', tipo: 'imagen' },
          { clave: 'texto', etiqueta: 'Texto', tipo: 'rico', porDefecto: '' },
        ],
      },
      {
        nombre: '3 · Qué incluye',
        campos: [{ clave: 'incluye', etiqueta: 'Texto', tipo: 'rico', porDefecto: '' }],
      },
    ],
    relacionado: [
      { etiqueta: 'Galería de live art', ruta: '/panel/portfolio', ayuda: 'Elige la sección «Live art» dentro del portfolio.' },
    ],
  },

  {
    slug: 'live-art-directo',
    nombre: 'Acuarelas en directo',
    ruta: '/live-art/acuarelas-en-directo',
    bloques: [
      {
        nombre: '1 · Cabecera',
        campos: [
          {
            clave: 'entradilla',
            etiqueta: 'Entradilla',
            tipo: 'parrafo',
            porDefecto: 'Pintamos durante la celebración y cada invitado se lleva su acuarela.',
          },
        ],
      },
      {
        nombre: '2 · Cómo funciona',
        campos: [
          { clave: 'imagen', etiqueta: 'Imagen', tipo: 'imagen' },
          { clave: 'texto', etiqueta: 'Texto', tipo: 'rico', porDefecto: '' },
        ],
      },
      {
        nombre: '3 · Qué incluye',
        campos: [{ clave: 'incluye', etiqueta: 'Texto', tipo: 'rico', porDefecto: '' }],
      },
    ],
    relacionado: [
      { etiqueta: 'Portfolio de live art', ruta: '/panel/portfolio', ayuda: 'La galería sale de la sección «Live art».' },
    ],
  },

  {
    slug: 'live-art-previo',
    nombre: 'Live art previo',
    ruta: '/live-art/previo',
    bloques: [
      {
        nombre: '1 · Cabecera',
        campos: [
          {
            clave: 'entradilla',
            etiqueta: 'Entradilla',
            tipo: 'parrafo',
            porDefecto: 'Acuarelas pintadas antes del día, para entregar ya enmarcadas o dentro de la papelería.',
          },
        ],
      },
      {
        nombre: '2 · Cómo funciona',
        campos: [
          { clave: 'imagen', etiqueta: 'Imagen', tipo: 'imagen' },
          { clave: 'texto', etiqueta: 'Texto', tipo: 'rico', porDefecto: '' },
        ],
      },
      {
        nombre: '3 · Qué incluye',
        campos: [{ clave: 'incluye', etiqueta: 'Texto', tipo: 'rico', porDefecto: '' }],
      },
    ],
    relacionado: [
      { etiqueta: 'Portfolio de live art', ruta: '/panel/portfolio', ayuda: 'La galería sale de la sección «Live art».' },
    ],
  },

  {
    slug: 'acuarelas-y-encargos',
    nombre: 'Acuarelas y encargos',
    ruta: '/acuarelas-y-encargos',
    bloques: [
      {
        nombre: '1 · Cabecera',
        campos: [
          { clave: 'entradilla', etiqueta: 'Entradilla', tipo: 'parrafo', porDefecto: 'Piezas únicas pintadas a mano para regalar o para tu casa.' },
        ],
      },
      {
        nombre: '2 · La sección',
        campos: [
          { clave: 'imagen', etiqueta: 'Imagen', tipo: 'imagen' },
          { clave: 'texto', etiqueta: 'Texto', tipo: 'rico', porDefecto: '' },
        ],
      },
      {
        nombre: '3 · Cómo trabajamos',
        campos: [{ clave: 'proceso', etiqueta: 'Texto', tipo: 'rico', porDefecto: '' }],
      },
    ],
    relacionado: [
      { etiqueta: 'Galería de acuarelas', ruta: '/panel/portfolio', ayuda: 'Elige la sección «Acuarelas y encargos».' },
    ],
  },

  {
    slug: 'talleres',
    nombre: 'Talleres',
    ruta: '/talleres',
    bloques: [
      {
        nombre: '1 · Cabecera',
        campos: [
          { clave: 'entradilla', etiqueta: 'Entradilla', tipo: 'parrafo', porDefecto: 'Cerámica, pintura e infantil. Sesiones con plazas limitadas en nuestro estudio.' },
          { clave: 'texto', etiqueta: 'Texto de la sección', tipo: 'rico', porDefecto: '' },
        ],
      },
      {
        nombre: '2 · Cómo se reserva',
        ayuda: 'Aparece al final, tras la lista de talleres.',
        campos: [{ clave: 'comoReservar', etiqueta: 'Texto', tipo: 'rico', porDefecto: '' }],
      },
    ],
    relacionado: [
      { etiqueta: 'Los talleres', ruta: '/panel/talleres', ayuda: 'Título, precio, duración, descripción y fotos de cada uno.' },
      { etiqueta: 'Fechas y plazas', ruta: '/panel/sesiones', ayuda: 'Cada fecha concreta, con sus plazas.' },
      { etiqueta: 'Bonos mensuales', ruta: '/panel/bonos', ayuda: 'Salen en su propia página, enlazada desde aquí.' },
    ],
  },

  {
    slug: 'contacto',
    nombre: 'Contacto',
    ruta: '/contacto',
    bloques: [
      {
        nombre: '1 · Cabecera',
        campos: [
          { clave: 'entradilla', etiqueta: 'Entradilla', tipo: 'parrafo', porDefecto: 'Cuéntanos qué necesitas y te respondemos con un presupuesto a medida.' },
          { clave: 'texto', etiqueta: 'Texto', tipo: 'rico', porDefecto: '' },
        ],
      },
    ],
    relacionado: [
      { etiqueta: 'Correo, teléfono y dirección', ruta: '/panel/ajustes', ayuda: 'El recuadro de la derecha sale de los ajustes del sitio.' },
      { etiqueta: 'Preguntas del formulario', ruta: '/panel/formularios', ayuda: 'Lo que se le pregunta a quien escribe.' },
    ],
  },

  {
    slug: 'legal',
    nombre: 'Textos legales',
    ruta: '/aviso-legal',
    bloques: [
      {
        nombre: 'Aviso legal',
        ayuda: 'Obligatorio: quién está detrás de la web y cómo contactar.',
        campos: [{ clave: 'avisoLegal', etiqueta: 'Texto', tipo: 'rico', porDefecto: '' }],
      },
      {
        nombre: 'Política de privacidad',
        ayuda: 'Obligatorio porque los formularios recogen datos personales.',
        campos: [{ clave: 'privacidad', etiqueta: 'Texto', tipo: 'rico', porDefecto: '' }],
      },
      {
        nombre: 'Política de cookies',
        campos: [{ clave: 'cookies', etiqueta: 'Texto', tipo: 'rico', porDefecto: '' }],
      },
    ],
    relacionado: [],
  },
];

export function paginaEditable(slug: string): PaginaEditable | undefined {
  return PAGINAS_EDITABLES.find((p) => p.slug === slug);
}

export function camposDe(pagina: PaginaEditable): CampoPagina[] {
  return pagina.bloques.flatMap((b) => b.campos);
}

export function textosPorDefecto(slug: string): Record<string, string> {
  const pagina = paginaEditable(slug);
  if (!pagina) return {};

  return Object.fromEntries(
    camposDe(pagina)
      .filter((c) => c.tipo !== 'imagen')
      .map((c) => [c.clave, c.porDefecto ?? '']),
  );
}

/** La familia que lleva cada campo mientras nadie la cambie desde el panel. */
export function estilosPorDefecto(slug: string): Record<string, EstiloTexto> {
  const pagina = paginaEditable(slug);
  if (!pagina) return {};

  return Object.fromEntries(
    camposDe(pagina)
      .filter((campo) => campo.estiloPorDefecto)
      .map((campo) => [campo.clave, campo.estiloPorDefecto as EstiloTexto]),
  );
}
