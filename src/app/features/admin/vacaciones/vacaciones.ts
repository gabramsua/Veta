import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Timestamp } from '@angular/fire/firestore';
import { catchError, of } from 'rxjs';

import { AdminsService } from '../../../core/data/admins.service';
import { AlertasService } from '../../../core/ui/alertas.service';
import { AuthService } from '../../../core/auth/auth.service';
import { EstadoVacio } from '../../../shared/estado-vacio/estado-vacio';
import { PanelSeccion } from '../../../shared/panel-seccion/panel-seccion';
import { TalleresService } from '../../../core/data/contenido.services';
import { Vacaciones as PeriodoVacaciones } from '../../../core/models';
import { VacacionesService, diasConsumidos, diasDelPeriodo } from '../../../core/data/vacaciones.service';

@Component({
  selector: 'veta-vacaciones',
  imports: [ReactiveFormsModule, PanelSeccion, EstadoVacio],
  templateUrl: './vacaciones.html',
  styleUrl: './vacaciones.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vacaciones {
  private readonly fb = inject(FormBuilder);
  private readonly servicio = inject(VacacionesService);
  private readonly admins = inject(AdminsService);
  private readonly talleres = inject(TalleresService);
  private readonly alertas = inject(AlertasService);
  private readonly auth = inject(AuthService);

  protected readonly anio = new Date().getFullYear();
  protected readonly uidPropio = this.auth.sesion()?.uid ?? '';
  protected readonly diasDelPeriodo = diasDelPeriodo;

  protected readonly periodos = toSignal(
    this.servicio.listarPorFecha().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly listaAdmins = toSignal(
    this.admins.listarOrdenados().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly listaTalleres = toSignal(
    this.talleres.listarOrdenados().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly formVisible = signal(false);
  protected readonly guardando = signal(false);
  protected readonly seleccionados = signal<string[]>([]);

  protected readonly formulario = this.fb.nonNullable.group({
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    nota: ['', Validators.maxLength(200)],
  });

  protected readonly contadores = computed(() =>
    this.listaAdmins().map((admin) => ({
      nombre: admin.nombre,
      esPropio: admin.id === this.uidPropio,
      dias: diasConsumidos(this.periodos(), admin.id, this.anio),
    })),
  );

  protected readonly delAnio = computed(() =>
    this.periodos().filter((p) => p.fechaInicio.toDate().getFullYear() === this.anio),
  );

  protected nombreAdmin(uid: string): string {
    return this.listaAdmins().find((a) => a.id === uid)?.nombre ?? 'Administradora borrada';
  }

  protected nombresTalleres(ids: string[]): string {
    if (ids.length === 0) return 'Todo el estudio';

    return ids
      .map((id) => this.listaTalleres().find((t) => t.id === id)?.titulo ?? '—')
      .join(', ');
  }

  protected formatearDia(fecha: Timestamp): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(fecha.toDate());
  }

  protected alternarTaller(id: string, marcado: boolean): void {
    this.seleccionados.update((actuales) =>
      marcado ? [...actuales, id] : actuales.filter((x) => x !== id),
    );
  }

  protected estaSeleccionado(id: string): boolean {
    return this.seleccionados().includes(id);
  }

  protected abrir(): void {
    this.formulario.reset({ fechaInicio: '', fechaFin: '', nota: '' });
    this.seleccionados.set([]);
    this.formVisible.set(true);
  }

  protected cerrar(): void {
    this.formVisible.set(false);
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();

    if (this.guardando()) return;

    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;

    const datos = this.formulario.getRawValue();
    const inicio = Timestamp.fromDate(new Date(`${datos.fechaInicio}T00:00:00`));
    const fin = Timestamp.fromDate(new Date(`${datos.fechaFin}T23:59:59`));

    if (fin.toMillis() < inicio.toMillis()) {
      await this.alertas.error(
        'Las fechas no cuadran',
        'La fecha de fin no puede ser anterior a la de inicio.',
      );
      return;
    }

    this.guardando.set(true);

    try {
      await this.servicio.crear({
        adminUid: this.uidPropio,
        fechaInicio: inicio,
        fechaFin: fin,
        workshopIds: this.seleccionados(),
        nota: datos.nota,
      } as Omit<PeriodoVacaciones, 'id'>);

      this.cerrar();
      await this.alertas.aviso('Periodo de vacaciones añadido');
    } catch {
      await this.alertas.error('No hemos podido guardar', 'Inténtalo de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  protected async borrar(periodo: PeriodoVacaciones): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      '¿Borrar este periodo?',
      `${this.formatearDia(periodo.fechaInicio)} — ${this.formatearDia(periodo.fechaFin)}. Esas fechas volverán a estar disponibles para reservar.`,
      'Sí, borrar',
    );

    if (!confirmado) return;

    await this.servicio.borrar(periodo.id);
    await this.alertas.aviso('Periodo borrado');
  }
}
