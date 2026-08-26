import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import type { Calendar as CalendarioFC, EventClickArg, EventInput } from '@fullcalendar/core';

import { EstadoVacio } from '../../../shared/estado-vacio/estado-vacio';
import { PanelSeccion } from '../../../shared/panel-seccion/panel-seccion';
import { SesionesService, TalleresService } from '../../../core/data/contenido.services';
import { VacacionesService } from '../../../core/data/vacaciones.service';

const COLORES = {
  libre: { fondo: '#5A6248', texto: '#F2EBE1' },
  casiLleno: { fondo: '#B0592B', texto: '#F2EBE1' },
  lleno: { fondo: '#E3D5C4', texto: '#2E2A26' },
  vacaciones: { fondo: '#CBB9A3', texto: '#2E2A26' },
};

@Component({
  selector: 'veta-calendario',
  imports: [PanelSeccion, EstadoVacio],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Calendario implements AfterViewInit, OnDestroy {
  private readonly sesiones = inject(SesionesService);
  private readonly talleres = inject(TalleresService);
  private readonly vacaciones = inject(VacacionesService);
  private readonly router = inject(Router);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('calendario');
  private calendario: CalendarioFC | null = null;

  protected readonly cargando = signal(true);

  private readonly listaSesiones = toSignal(
    this.sesiones.listarPorFecha().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  private readonly listaTalleres = toSignal(
    this.talleres.listarOrdenados().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  private readonly listaVacaciones = toSignal(
    this.vacaciones.listarPorFecha().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly hayDatos = computed(
    () => this.listaSesiones().length > 0 || this.listaVacaciones().length > 0,
  );

  private readonly eventos = computed<EventInput[]>(() => {
    const talleres = new Map(this.listaTalleres().map((t) => [t.id, t]));

    const sesiones = this.listaSesiones().map((sesion) => {
      const taller = talleres.get(sesion.workshopId);
      const libres = Math.max(0, sesion.plazasTotales - sesion.plazasConfirmadas);
      const color =
        libres === 0 ? COLORES.lleno : libres <= 2 ? COLORES.casiLleno : COLORES.libre;

      return {
        id: sesion.id,
        title: `${taller?.titulo ?? 'Taller'} · ${libres}/${sesion.plazasTotales}`,
        start: sesion.fechaInicio.toDate().toISOString(),
        end: sesion.fechaFin.toDate().toISOString(),
        backgroundColor: sesion.activa ? color.fondo : '#CBB9A3',
        borderColor: sesion.activa ? color.fondo : '#CBB9A3',
        textColor: color.texto,
        extendedProps: { tipo: 'sesion' as const },
      };
    });

    const cierres = this.listaVacaciones().map((periodo) => ({
      id: `vac-${periodo.id}`,
      title: periodo.nota || 'Vacaciones',
      start: periodo.fechaInicio.toDate().toISOString(),
      // FullCalendar trata el final como exclusivo en eventos de día completo.
      end: new Date(periodo.fechaFin.toDate().getTime() + 24 * 60 * 60 * 1000).toISOString(),
      backgroundColor: COLORES.vacaciones.fondo,
      borderColor: COLORES.vacaciones.fondo,
      textColor: COLORES.vacaciones.texto,
      display: 'background',
      extendedProps: { tipo: 'vacaciones' as const },
    }));

    return [...sesiones, ...cierres];
  });

  constructor() {
    effect(() => {
      const eventos = this.eventos();
      if (!this.calendario) return;

      this.calendario.removeAllEventSources();
      this.calendario.addEventSource(eventos);
    });
  }

  // FullCalendar toca window al importarse, así que se carga bajo demanda y solo
  // en navegador, igual que Jodit y SweetAlert2.
  async ngAfterViewInit(): Promise<void> {
    if (!this.esNavegador) return;

    const [{ Calendar }, dayGrid, timeGrid, list, es] = await Promise.all([
      import('@fullcalendar/core'),
      import('@fullcalendar/daygrid'),
      import('@fullcalendar/timegrid'),
      import('@fullcalendar/list'),
      import('@fullcalendar/core/locales/es'),
    ]);

    this.calendario = new Calendar(this.contenedor().nativeElement, {
      plugins: [dayGrid.default, timeGrid.default, list.default],
      initialView: 'dayGridMonth',
      locale: es.default,
      height: 'auto',
      firstDay: 1,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,listMonth',
      },
      buttonText: { today: 'Hoy', month: 'Mes', week: 'Semana', list: 'Lista' },
      noEventsText: 'No hay sesiones en estas fechas',
      events: this.eventos(),
      eventClick: (info: EventClickArg) => {
        // `extendedProps` es un diccionario: con noPropertyAccessFromIndexSignature
        // hay que leerlo con corchetes.
        if (info.event.extendedProps['tipo'] === 'sesion') {
          void this.router.navigate(['/panel/sesiones']);
        }
      },
    });

    this.calendario.render();
    this.cargando.set(false);
  }

  ngOnDestroy(): void {
    this.calendario?.destroy();
    this.calendario = null;
  }
}
