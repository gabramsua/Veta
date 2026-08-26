import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { EstadoVacio } from '../../../shared/estado-vacio/estado-vacio';
import { ReservasService, SolicitudesService } from '../../../core/data/solicitudes.service';
import { SesionesService, TalleresService } from '../../../core/data/contenido.services';
import { formatearFecha } from '../../../core/data/fechas';

const TREINTA_DIAS = 30 * 24 * 60 * 60 * 1000;

interface Metrica {
  etiqueta: string;
  valor: string;
  pie: string;
  ruta: string;
  urgente: boolean;
}

@Component({
  selector: 'veta-panel-inicio',
  imports: [RouterLink, EstadoVacio],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inicio {
  private readonly reservas = inject(ReservasService);
  private readonly solicitudes = inject(SolicitudesService);
  private readonly sesiones = inject(SesionesService);
  private readonly talleres = inject(TalleresService);
  private readonly auth = inject(AuthService);

  protected readonly formatearFecha = formatearFecha;
  protected readonly nombre = computed(() => this.auth.sesion()?.nombre ?? '');

  private readonly listaReservas = toSignal(
    this.reservas.listarRecientes(200).pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  private readonly listaSolicitudes = toSignal(
    this.solicitudes.listarRecientes(200).pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  private readonly listaSesiones = toSignal(
    this.sesiones.listarPorFecha().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  private readonly listaTalleres = toSignal(
    this.talleres.listarOrdenados().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly proximas = computed(() => {
    const ahora = Date.now();
    const talleres = new Map(this.listaTalleres().map((t) => [t.id, t]));

    return this.listaSesiones()
      .filter((s) => s.fechaInicio.toMillis() >= ahora && s.fechaInicio.toMillis() <= ahora + TREINTA_DIAS)
      .slice(0, 6)
      .map((sesion) => ({
        sesion,
        titulo: talleres.get(sesion.workshopId)?.titulo ?? 'Taller borrado',
        libres: Math.max(0, sesion.plazasTotales - sesion.plazasConfirmadas),
        pendientes: this.listaReservas().filter(
          (r) => r.sessionId === sesion.id && r.status === 'pendiente',
        ).length,
      }));
  });

  protected readonly metricas = computed<Metrica[]>(() => {
    const pendientes = this.listaReservas().filter((r) => r.status === 'pendiente').length;
    const sinResponder = this.listaSolicitudes().filter((s) => s.status === 'nueva').length;
    const proximas = this.proximas();

    // La ocupación se mide solo sobre las sesiones que aún no han pasado: mezclar
    // las antiguas daría un número que no sirve para decidir nada.
    const totales = proximas.reduce((n, p) => n + p.sesion.plazasTotales, 0);
    const ocupadas = proximas.reduce((n, p) => n + p.sesion.plazasConfirmadas, 0);

    return [
      {
        etiqueta: 'Reservas pendientes',
        valor: String(pendientes),
        pie: pendientes > 0 ? 'Esperando tu confirmación' : 'Todo al día',
        ruta: '/panel/reservas',
        urgente: pendientes > 0,
      },
      {
        etiqueta: 'Solicitudes sin abrir',
        valor: String(sinResponder),
        pie: sinResponder > 0 ? 'Presupuestos por revisar' : 'Todo al día',
        ruta: '/panel/solicitudes',
        urgente: sinResponder > 0,
      },
      {
        etiqueta: 'Próximas sesiones',
        valor: String(proximas.length),
        pie: 'En los próximos 30 días',
        ruta: '/panel/calendario',
        urgente: false,
      },
      {
        etiqueta: 'Plazas ocupadas',
        valor: totales > 0 ? `${Math.round((ocupadas / totales) * 100)} %` : '—',
        pie: totales > 0 ? `${ocupadas} de ${totales} plazas` : 'Sin sesiones programadas',
        ruta: '/panel/sesiones',
        urgente: false,
      },
    ];
  });
}
