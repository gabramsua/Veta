import { PAGINAS_EDITABLES } from './textos';

export interface GrupoMenuAdmin {
  etiqueta: string;
  icono: string;
  ruta?: string;
  ayuda?: string;
  hijos?: { etiqueta: string; ruta: string }[];
}

/**
 * Menú del panel.
 *
 * «La web» va página por página, en el mismo orden que el menú público, porque
 * es así como piensa quien lo usa: no busca «productos», busca «la página de
 * invitaciones». Lo que es un catálogo de verdad (talleres, fechas, modelos)
 * tiene su propio grupo, y cada página enlaza al catálogo que le corresponde.
 */
export const NAV_PANEL: GrupoMenuAdmin[] = [
  { etiqueta: 'Inicio', icono: 'gauge', ruta: '/panel/inicio' },
  { etiqueta: 'Calendario', icono: 'calendar-days', ruta: '/panel/calendario' },
  { etiqueta: 'Reservas', icono: 'clipboard-list', ruta: '/panel/reservas' },
  { etiqueta: 'Solicitudes', icono: 'inbox', ruta: '/panel/solicitudes' },
  {
    etiqueta: 'La web',
    icono: 'browser',
    ayuda: 'Por orden de aparición en el menú',
    hijos: [
      ...PAGINAS_EDITABLES.filter((p) => p.slug !== 'legal').map((p) => ({
        etiqueta: p.nombre,
        ruta: `/panel/web/${p.slug}`,
      })),
      { etiqueta: 'Preguntas frecuentes', ruta: '/panel/faq' },
      { etiqueta: 'Textos legales', ruta: '/panel/web/legal' },
    ],
  },
  {
    etiqueta: 'Catálogo',
    icono: 'palette',
    ayuda: 'Lo que se muestra dentro de las páginas',
    hijos: [
      { etiqueta: 'Talleres', ruta: '/panel/talleres' },
      { etiqueta: 'Fechas y plazas', ruta: '/panel/sesiones' },
      { etiqueta: 'Bonos mensuales', ruta: '/panel/bonos' },
      { etiqueta: 'Modelos de papelería', ruta: '/panel/productos' },
      { etiqueta: 'Testimonios', ruta: '/panel/frases' },
    ],
  },
  {
    etiqueta: 'Imágenes',
    icono: 'images',
    hijos: [
      { etiqueta: 'Galerías del portfolio', ruta: '/panel/portfolio' },
      { etiqueta: 'Biblioteca de medios', ruta: '/panel/medios' },
    ],
  },
  {
    etiqueta: 'Configuración',
    icono: 'gear',
    hijos: [
      { etiqueta: 'Ajustes del sitio', ruta: '/panel/ajustes' },
      { etiqueta: 'Preguntas de formularios', ruta: '/panel/formularios' },
      { etiqueta: 'Plantillas de email', ruta: '/panel/plantillas' },
      { etiqueta: 'Vacaciones', ruta: '/panel/vacaciones' },
      { etiqueta: 'Administradoras', ruta: '/panel/administradoras' },
    ],
  },
];
