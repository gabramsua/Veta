import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';

import { BonosService, SesionesService, TalleresService } from '../../../core/data/contenido.services';
import { EstadoVacio } from '../../../shared/estado-vacio/estado-vacio';
import { PanelSeccion } from '../../../shared/panel-seccion/panel-seccion';
import { Reserva, Solicitud, TipoSolicitud } from '../../../core/models';
import { ReservasService, SolicitudesService } from '../../../core/data/solicitudes.service';
import {
  EstadisticasService,
  EstadisticasWeb,
  PERIODOS,
  Periodo,
  inicioDelPeriodo,
} from '../../../core/data/estadisticas.service';

const TIPOS: Record<TipoSolicitud, string> = {
  papeleria: 'Papelería de bodas',
  liveart: 'Live art',
  encargo: 'Acuarelas y encargos',
  evento: 'Taller privado',
  contacto: 'Contacto general',
};

@Component({
  selector: 'veta-estadisticas',
  imports: [PanelSeccion, EstadoVacio],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Estadisticas {
  private readonly reservasService = inject(ReservasService);
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly sesiones = inject(SesionesService);
  private readonly talleres = inject(TalleresService);
  private readonly bonos = inject(BonosService);
  private readonly estadisticas = inject(EstadisticasService);

  protected readonly periodos = PERIODOS;
  protected readonly periodo = signal<Periodo>('trimestre');

  protected readonly desde = computed(() => inicioDelPeriodo(this.periodo()));

  private readonly desde$ = toObservable(this.desde);

  private readonly reservas = toSignal(
    this.desde$.pipe(
      switchMap((desde) => this.reservasService.listarDesde(desde).pipe(catchError(() => of([])))),
    ),
    { initialValue: [] as Reserva[] },
  );

  private readonly solicitudes = toSignal(
    this.desde$.pipe(
      switchMap((desde) =>
        this.solicitudesService.listarDesde(desde).pipe(catchError(() => of([]))),
      ),
    ),
    { initialValue: [] as Solicitud[] },
  );

  private readonly listaSesiones = toSignal(
    this.sesiones.listarPorFecha().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  private readonly listaTalleres = toSignal(
    this.talleres.listarOrdenados().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  private readonly listaBonos = toSignal(this.bonos.listarOrdenados().pipe(catchError(() => of([]))), {
    initialValue: [],
  });

  // --- El estudio ---

  private readonly confirmadas = computed(() =>
    this.reservas().filter((r) => r.status === 'confirmada'),
  );

  protected readonly resumen = computed(() => {
    const total = this.reservas().length;
    const confirmadas = this.confirmadas();
    const canceladas = this.reservas().filter((r) => r.status === 'cancelada').length;
    const personas = confirmadas.reduce((n, r) => n + r.nPersonas, 0);
    const solicitudes = this.solicitudes().length;

    return [
      { etiqueta: 'Reservas confirmadas', valor: String(confirmadas.length), pie: `${total} solicitadas en total` },
      { etiqueta: 'Personas', valor: String(personas), pie: 'En reservas confirmadas' },
      { etiqueta: 'Canceladas', valor: String(canceladas), pie: total > 0 ? `${Math.round((canceladas / total) * 100)} % de las recibidas` : 'Sin reservas' },
      { etiqueta: 'Presupuestos pedidos', valor: String(solicitudes), pie: 'Formularios recibidos' },
    ];
  });

  /**
   * Cuántas reservas se quedan por el camino.
   *
   * Se mide sobre las recibidas en el periodo, no sobre las confirmadas en él:
   * una reserva de marzo que se confirma en abril seguiría contando en marzo,
   * que es cuando llegó.
   */
  protected readonly conversion = computed(() => {
    const total = this.reservas().length;
    if (total === 0) return null;

    return Math.round((this.confirmadas().length / total) * 100);
  });

  // --- Qué funciona ---

  protected readonly porTaller = computed(() => {
    const sesiones = this.listaSesiones();
    const talleres = this.listaTalleres();
    const bonos = this.listaBonos();
    const cuenta = new Map<string, number>();

    for (const reserva of this.confirmadas()) {
      const nombre =
        reserva.tipo === 'bono'
          ? bonos.find((b) => b.id === reserva.bonoId)?.titulo
          : talleres.find(
              (t) => t.id === sesiones.find((s) => s.id === reserva.sessionId)?.workshopId,
            )?.titulo;

      if (!nombre) continue;

      cuenta.set(nombre, (cuenta.get(nombre) ?? 0) + reserva.nPersonas);
    }

    const total = [...cuenta.values()].reduce((n, v) => n + v, 0);

    return [...cuenta.entries()]
      .map(([nombre, personas]) => ({
        nombre,
        personas,
        porcentaje: total > 0 ? Math.round((personas / total) * 100) : 0,
      }))
      .sort((a, b) => b.personas - a.personas);
  });

  protected readonly porTipoSolicitud = computed(() => {
    const cuenta = new Map<TipoSolicitud, number>();

    for (const solicitud of this.solicitudes()) {
      cuenta.set(solicitud.tipo, (cuenta.get(solicitud.tipo) ?? 0) + 1);
    }

    const total = this.solicitudes().length;

    return [...cuenta.entries()]
      .map(([tipo, cuantas]) => ({
        nombre: TIPOS[tipo] ?? tipo,
        cuantas,
        porcentaje: total > 0 ? Math.round((cuantas / total) * 100) : 0,
      }))
      .sort((a, b) => b.cuantas - a.cuantas);
  });

  // --- La web ---

  protected readonly web = signal<EstadisticasWeb | null>(null);
  protected readonly cargandoWeb = signal(false);
  protected readonly errorWeb = signal('');

  /**
   * Los datos solo cuando hay algo que pintar.
   *
   * El `@if` de la plantilla tiene que llevar el `as` en la rama principal
   * —Angular no lo admite en un `@else if`—, así que la condición de «hay
   * datos y están configurados» se resuelve aquí y no allí.
   */
  protected readonly webLista = computed(() => {
    const datos = this.web();
    return datos?.configurado ? datos : null;
  });

  protected readonly visitas = computed(() =>
    (this.web()?.porDia ?? []).reduce((n, d) => n + d.visitas, 0),
  );

  protected readonly paginasVistas = computed(() =>
    (this.web()?.porDia ?? []).reduce((n, d) => n + d.paginasVistas, 0),
  );

  constructor() {
    effect(() => {
      const desde = this.desde();
      void this.cargarWeb(desde);
    });
  }

  private async cargarWeb(desde: Date): Promise<void> {
    this.cargandoWeb.set(true);
    this.errorWeb.set('');

    try {
      this.web.set(await this.estadisticas.web(desde, new Date()));
    } catch (e) {
      const mensaje =
        typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Inténtalo de nuevo.';

      this.errorWeb.set(mensaje);
      this.web.set(null);
    } finally {
      this.cargandoWeb.set(false);
    }
  }

  protected etiquetaPeriodo(): string {
    return PERIODOS.find((p) => p.valor === this.periodo())?.etiqueta ?? '';
  }
}
