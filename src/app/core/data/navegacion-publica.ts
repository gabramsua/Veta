import { SeccionesActivas } from '../models';

export interface EnlaceNav {
  etiqueta: string;
  ruta: string;
  seccion?: keyof SeccionesActivas;
  hijos?: EnlaceNav[];
}

const TODOS: EnlaceNav[] = [
  { etiqueta: 'Inicio', ruta: '/' },
  { etiqueta: 'Quiénes somos', ruta: '/quienes-somos' },
  {
    etiqueta: 'Papelería de bodas',
    ruta: '/papeleria-de-bodas',
    hijos: [
      { etiqueta: 'Invitaciones', ruta: '/papeleria-de-bodas/invitaciones' },
      { etiqueta: 'Seating plan y meseros', ruta: '/papeleria-de-bodas/seating' },
      { etiqueta: 'Minutas', ruta: '/papeleria-de-bodas/minutas' },
      { etiqueta: 'Marcasitios', ruta: '/papeleria-de-bodas/marcasitios' },
      { etiqueta: 'Láminas personalizadas', ruta: '/papeleria-de-bodas/laminas' },
      { etiqueta: 'Pack completo', ruta: '/papeleria-de-bodas/pack' },
    ],
  },
  { etiqueta: 'Live art', ruta: '/live-art', seccion: 'liveart' },
  { etiqueta: 'Acuarelas y encargos', ruta: '/acuarelas-y-encargos' },
  {
    etiqueta: 'Talleres',
    ruta: '/talleres',
    seccion: 'talleres',
    hijos: [
      { etiqueta: 'Talleres puntuales', ruta: '/talleres' },
      { etiqueta: 'Bonos mensuales', ruta: '/talleres/bonos', seccion: 'bonos' },
    ],
  },
  { etiqueta: 'Preguntas frecuentes', ruta: '/preguntas-frecuentes', seccion: 'faq' },
  { etiqueta: 'Contacto', ruta: '/contacto' },
];

export function navegacionVisible(secciones: SeccionesActivas): EnlaceNav[] {
  const visible = (enlace: EnlaceNav) => !enlace.seccion || secciones[enlace.seccion];

  return TODOS.filter(visible).map((enlace) =>
    enlace.hijos ? { ...enlace, hijos: enlace.hijos.filter(visible) } : enlace,
  );
}
