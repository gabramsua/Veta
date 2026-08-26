import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'acceso', renderMode: RenderMode.Client },
  { path: 'panel', renderMode: RenderMode.Client },
  { path: 'panel/**', renderMode: RenderMode.Client },
  // Los formularios son puramente interactivos y no aportan nada en buscadores.
  // Renderizarlos en servidor solo añadiría latencia.
  { path: 'reservar/**', renderMode: RenderMode.Client },
  { path: 'solicitar/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
