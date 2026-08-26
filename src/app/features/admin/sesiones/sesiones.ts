import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AlertasService } from '../../../core/ui/alertas.service';
import { EstadoVacio } from '../../../shared/estado-vacio/estado-vacio';
import { PanelSeccion } from '../../../shared/panel-seccion/panel-seccion';
import { SesionesService, TalleresService } from '../../../core/data/contenido.services';
import { Sesion } from '../../../core/models';
import { VacacionesService, estaBloqueado } from '../../../core/data/vacaciones.service';
import { aValorInput, desdeValorInput, formatearFecha, seSolapan } from '../../../core/data/fechas';

@Component({
  selector: 'veta-sesiones',
  imports: [ReactiveFormsModule, PanelSeccion, EstadoVacio],
  templateUrl: './sesiones.html',
  styleUrl: './sesiones.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sesiones {
  private readonly fb = inject(FormBuilder);
  private readonly sesiones = inject(SesionesService);
  private readonly talleres = inject(TalleresService);
  private readonly alertas = inject(AlertasService);
  private readonly vacaciones = inject(VacacionesService);

  protected readonly formatearFecha = formatearFecha;

  protected readonly listaTalleres = toSignal(
    this.talleres.listarOrdenados().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly lista = toSignal(
    this.sesiones.listarPorFecha().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  private readonly periodos = toSignal(
    this.vacaciones.listarPorFecha().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly filtroTaller = signal('');
  protected readonly verPasadas = signal(false);
  protected readonly editando = signal<Sesion | null>(null);
  protected readonly formVisible = signal(false);
  protected readonly guardando = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    workshopId: ['', Validators.required],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    plazasTotales: [8, [Validators.required, Validators.min(1), Validators.max(60)]],
    activa: [true],
    notasInternas: [''],
  });

  protected readonly filtradas = computed(() => {
    const taller = this.filtroTaller();
    const ahora = Date.now();

    return this.lista().filter(
      (s) =>
        (!taller || s.workshopId === taller) &&
        (this.verPasadas() || s.fechaFin.toMillis() >= ahora),
    );
  });

  protected readonly tituloForm = computed(() =>
    this.editando() ? 'Editar sesión' : 'Nueva sesión',
  );

  protected nombreTaller(workshopId: string): string {
    return this.listaTalleres().find((t) => t.id === workshopId)?.titulo ?? 'Taller borrado';
  }

  protected esPasada(sesion: Sesion): boolean {
    return sesion.fechaFin.toMillis() < Date.now();
  }

  protected plazasLibres(sesion: Sesion): number {
    return Math.max(0, sesion.plazasTotales - sesion.plazasConfirmadas);
  }

  protected abrir(sesion?: Sesion): void {
    this.editando.set(sesion ?? null);

    this.formulario.reset({
      workshopId: sesion?.workshopId ?? this.filtroTaller() ?? '',
      fechaInicio: aValorInput(sesion?.fechaInicio),
      fechaFin: aValorInput(sesion?.fechaFin),
      plazasTotales: sesion?.plazasTotales ?? 8,
      activa: sesion?.activa ?? true,
      notasInternas: sesion?.notasInternas ?? '',
    });

    this.formVisible.set(true);
  }

  protected cerrar(): void {
    this.formVisible.set(false);
    this.editando.set(null);
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();

    if (this.guardando()) return;

    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;

    const datos = this.formulario.getRawValue();
    const inicio = desdeValorInput(datos.fechaInicio);
    const fin = desdeValorInput(datos.fechaFin);

    if (fin.toMillis() <= inicio.toMillis()) {
      await this.alertas.error(
        'Las fechas no cuadran',
        'La hora de fin tiene que ser posterior a la de inicio.',
      );
      return;
    }

    const editando = this.editando();

    // Dos sesiones del mismo taller a la vez no tienen sentido: son las mismas
    // manos y el mismo espacio.
    const solapada = this.lista().find(
      (s) =>
        s.id !== editando?.id &&
        s.workshopId === datos.workshopId &&
        seSolapan(inicio, fin, s.fechaInicio, s.fechaFin),
    );

    if (solapada) {
      await this.alertas.error(
        'Se solapa con otra sesión',
        `Ya hay una sesión de este taller el ${formatearFecha(solapada.fechaInicio)}.`,
      );
      return;
    }

    const vacaciones = estaBloqueado(this.periodos(), datos.workshopId, inicio, fin);

    if (vacaciones) {
      await this.alertas.error(
        'Esas fechas están de vacaciones',
        `Hay un periodo bloqueado del ${formatearFecha(vacaciones.fechaInicio)} al ${formatearFecha(vacaciones.fechaFin)}. Cámbialo desde Vacaciones si te has equivocado.`,
      );
      return;
    }

    if (editando && datos.plazasTotales < editando.plazasConfirmadas) {
      await this.alertas.error(
        'No puedes bajar tanto las plazas',
        `Ya hay ${editando.plazasConfirmadas} reserva(s) confirmada(s) en esta sesión.`,
      );
      return;
    }

    this.guardando.set(true);

    try {
      const payload = {
        workshopId: datos.workshopId,
        fechaInicio: inicio,
        fechaFin: fin,
        plazasTotales: datos.plazasTotales,
        activa: datos.activa,
        notasInternas: datos.notasInternas,
      };

      if (editando) {
        await this.sesiones.actualizar(editando.id, payload);
      } else {
        await this.sesiones.crear({ ...payload, plazasConfirmadas: 0 } as Omit<Sesion, 'id'>);
      }

      this.cerrar();
      await this.alertas.aviso(editando ? 'Sesión actualizada' : 'Sesión creada');
    } catch {
      await this.alertas.error('No hemos podido guardar', 'Inténtalo de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  protected async alternarActiva(sesion: Sesion): Promise<void> {
    await this.sesiones.actualizar(sesion.id, { activa: !sesion.activa });
  }

  protected async borrar(sesion: Sesion): Promise<void> {
    if (sesion.plazasConfirmadas > 0) {
      await this.alertas.error(
        'Esta sesión tiene reservas',
        `Hay ${sesion.plazasConfirmadas} plaza(s) confirmada(s). Avisa a las clientas y cancela sus reservas antes de borrarla.`,
      );
      return;
    }

    const confirmado = await this.alertas.confirmar(
      '¿Borrar esta sesión?',
      `${this.nombreTaller(sesion.workshopId)} · ${formatearFecha(sesion.fechaInicio)}`,
      'Sí, borrar',
    );

    if (!confirmado) return;

    await this.sesiones.borrar(sesion.id);
    await this.alertas.aviso('Sesión borrada');
  }
}
