import { Routes } from '@angular/router';

import { authGuard, invitadoGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'acceso',
    loadComponent: () => import('./features/admin/acceso/acceso').then((m) => m.Acceso),
    canActivate: [invitadoGuard],
    title: 'Acceso · Veta',
  },
  {
    path: 'panel',
    loadComponent: () => import('./layout/admin-layout/admin-layout').then((m) => m.AdminLayout),
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () => import('./features/admin/inicio/inicio').then((m) => m.Inicio),
        title: 'Panel · Veta',
      },
      {
        path: 'administradoras',
        loadComponent: () =>
          import('./features/admin/administradoras/administradoras').then((m) => m.Administradoras),
        title: 'Administradoras · Veta',
      },
      {
        path: 'ajustes',
        loadComponent: () => import('./features/admin/ajustes/ajustes').then((m) => m.Ajustes),
        title: 'Ajustes del sitio · Veta',
      },
      {
        path: 'calendario',
        loadComponent: () =>
          import('./features/admin/calendario/calendario').then((m) => m.Calendario),
        title: 'Calendario · Veta',
      },
      {
        path: 'reservas',
        loadComponent: () => import('./features/admin/reservas/reservas').then((m) => m.Reservas),
        title: 'Reservas · Veta',
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./features/admin/solicitudes/solicitudes').then((m) => m.Solicitudes),
        title: 'Solicitudes · Veta',
      },
      {
        path: 'medios',
        loadComponent: () => import('./features/admin/medios/medios').then((m) => m.Medios),
        title: 'Biblioteca de medios · Veta',
      },
      {
        path: 'talleres',
        loadComponent: () => import('./features/admin/talleres/talleres').then((m) => m.Talleres),
        title: 'Talleres · Veta',
      },
      {
        path: 'sesiones',
        loadComponent: () => import('./features/admin/sesiones/sesiones').then((m) => m.Sesiones),
        title: 'Sesiones · Veta',
      },
      {
        path: 'bonos',
        loadComponent: () => import('./features/admin/bonos/bonos').then((m) => m.Bonos),
        title: 'Bonos mensuales · Veta',
      },
      {
        path: 'productos',
        loadComponent: () => import('./features/admin/productos/productos').then((m) => m.Productos),
        title: 'Papelería · Veta',
      },
      {
        path: 'portfolio',
        loadComponent: () => import('./features/admin/portfolio/portfolio').then((m) => m.Portfolio),
        title: 'Portfolio · Veta',
      },
      {
        path: 'faq',
        loadComponent: () => import('./features/admin/faq/faq').then((m) => m.FaqAdmin),
        title: 'Preguntas frecuentes · Veta',
      },
      {
        path: 'frases',
        loadComponent: () => import('./features/admin/frases/frases').then((m) => m.Frases),
        title: 'Frases y testimonios · Veta',
      },
      {
        path: 'web/:slug',
        loadComponent: () => import('./features/admin/pagina/pagina').then((m) => m.Pagina),
        title: 'Editar página · Veta',
      },
      {
        path: 'formularios',
        loadComponent: () =>
          import('./features/admin/formularios/formularios').then((m) => m.Formularios),
        title: 'Preguntas de los formularios · Veta',
      },
      {
        path: 'vacaciones',
        loadComponent: () =>
          import('./features/admin/vacaciones/vacaciones').then((m) => m.Vacaciones),
        title: 'Vacaciones · Veta',
      },
      {
        path: 'plantillas',
        loadComponent: () =>
          import('./features/admin/plantillas/plantillas').then((m) => m.Plantillas),
        title: 'Plantillas de email · Veta',
      },
      {
        path: '**',
        loadComponent: () =>
          import('./features/admin/en-construccion/en-construccion').then((m) => m.EnConstruccion),
        title: 'En construcción · Veta',
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layout/public-layout/public-layout').then((m) => m.PublicLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/public/home/home').then((m) => m.Home),
        title: 'Veta · Estudio Creativo en Sevilla',
      },
      {
        path: 'quienes-somos',
        loadComponent: () =>
          import('./features/public/quienes-somos/quienes-somos').then((m) => m.QuienesSomos),
        title: 'Quiénes somos · Veta',
      },
      {
        path: 'papeleria-de-bodas',
        loadComponent: () =>
          import('./features/public/papeleria/papeleria').then((m) => m.Papeleria),
        title: 'Papelería de bodas · Veta',
      },
      {
        path: 'papeleria-de-bodas/:categoria',
        loadComponent: () =>
          import('./features/public/papeleria-detalle/papeleria-detalle').then(
            (m) => m.PapeleriaDetalle,
          ),
      },
      {
        path: 'live-art',
        loadComponent: () => import('./features/public/live-art/live-art').then((m) => m.LiveArt),
        title: 'Live art · Acuarelas en directo · Veta',
      },
      {
        path: 'acuarelas-y-encargos',
        loadComponent: () => import('./features/public/acuarelas/acuarelas').then((m) => m.Acuarelas),
        title: 'Acuarelas y encargos · Veta',
      },
      {
        path: 'talleres',
        loadComponent: () => import('./features/public/talleres/talleres').then((m) => m.Talleres),
        title: 'Talleres · Veta',
      },
      {
        path: 'talleres/bonos',
        loadComponent: () => import('./features/public/bonos/bonos').then((m) => m.Bonos),
        title: 'Bonos mensuales · Veta',
      },
      {
        path: 'preguntas-frecuentes',
        loadComponent: () => import('./features/public/faq/faq').then((m) => m.Faq),
        title: 'Preguntas frecuentes · Veta',
      },
      {
        path: 'contacto',
        loadComponent: () => import('./features/public/contacto/contacto').then((m) => m.Contacto),
        title: 'Contacto · Veta',
      },
      {
        path: 'reservar/:sesion',
        loadComponent: () => import('./features/public/reservar/reservar').then((m) => m.Reservar),
        title: 'Reservar plaza · Veta',
      },
      {
        path: 'solicitar/:tipo',
        loadComponent: () => import('./features/public/solicitar/solicitar').then((m) => m.Solicitar),
        title: 'Solicitud · Veta',
      },
      {
        path: 'aviso-legal',
        loadComponent: () => import('./features/public/legal/legal').then((m) => m.Legal),
        data: { tipo: 'avisoLegal' },
        title: 'Aviso legal · Veta',
      },
      {
        path: 'politica-de-privacidad',
        loadComponent: () => import('./features/public/legal/legal').then((m) => m.Legal),
        data: { tipo: 'privacidad' },
        title: 'Política de privacidad · Veta',
      },
      {
        path: 'politica-de-cookies',
        loadComponent: () => import('./features/public/legal/legal').then((m) => m.Legal),
        data: { tipo: 'cookies' },
        title: 'Política de cookies · Veta',
      },
      {
        path: '**',
        loadComponent: () =>
          import('./features/public/no-encontrado/no-encontrado').then((m) => m.NoEncontrado),
        title: 'Página no encontrada · Veta',
      },
    ],
  },
];
