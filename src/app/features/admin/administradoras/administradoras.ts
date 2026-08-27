import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AdminsService } from '../../../core/data/admins.service';
import { AlertasService } from '../../../core/ui/alertas.service';
import { AuthService } from '../../../core/auth/auth.service';
import { VacacionesService, diasConsumidos } from '../../../core/data/vacaciones.service';

@Component({
  selector: 'veta-administradoras',
  imports: [ReactiveFormsModule],
  templateUrl: './administradoras.html',
  styleUrl: './administradoras.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Administradoras {
  private readonly fb = inject(FormBuilder);
  private readonly admins = inject(AdminsService);
  private readonly alertas = inject(AlertasService);
  private readonly auth = inject(AuthService);
  private readonly vacaciones = inject(VacacionesService);

  protected readonly uidPropio = this.auth.sesion()?.uid ?? '';
  protected readonly lista = toSignal(
    this.admins.listarOrdenados().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly formVisible = signal(false);
  protected readonly enviando = signal(false);
  protected readonly reseteando = signal('');

  /**
   * Los días de vacaciones se calculan a partir de los periodos, no se guardan.
   *
   * Antes se leía `admins.diasVacaciones`, un contador que nadie incrementaba
   * nunca: la tabla enseñaba siempre 0 días mientras la sección de Vacaciones
   * mostraba el número correcto. Un valor derivado que además se almacena es un
   * valor que puede mentir, y aquí mentía desde el primer día.
   */
  private readonly periodos = toSignal(this.vacaciones.listarPorFecha().pipe(catchError(() => of([]))), {
    initialValue: [],
  });

  private readonly anio = new Date().getFullYear();

  protected diasDe(uid: string): number {
    return diasConsumidos(this.periodos(), uid, this.anio);
  }

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected get nombre() {
    return this.formulario.controls.nombre;
  }

  protected get email() {
    return this.formulario.controls.email;
  }

  protected get password() {
    return this.formulario.controls.password;
  }

  protected abrirForm(): void {
    this.formulario.reset();
    this.formVisible.set(true);
  }

  protected cerrarForm(): void {
    this.formVisible.set(false);
  }

  protected async invitar(evento: Event): Promise<void> {
    evento.preventDefault();

    if (this.enviando()) return;

    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;

    this.enviando.set(true);

    try {
      const datos = this.formulario.getRawValue();
      await this.admins.invitar({ ...datos, email: datos.email.trim() });
      this.cerrarForm();
      await this.alertas.exito(
        'Administradora creada',
        `Pásale a ${datos.nombre} su contraseña por un canal seguro y pídele que la cambie al entrar.`,
      );
    } catch {
      await this.alertas.error(
        'No hemos podido crear la cuenta',
        'Comprueba que el correo no esté ya registrado y vuelve a intentarlo.',
      );
    } finally {
      this.enviando.set(false);
    }
  }

  protected async resetearPassword(id: string, nombre: string, email: string): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      '¿Mandar un cambio de contraseña?',
      `${nombre} recibirá un correo en ${email} con un enlace para elegir una contraseña nueva. ` +
        'Su contraseña actual sigue funcionando hasta que use el enlace.',
      'Sí, mandar el correo',
    );

    if (!confirmado) return;

    this.reseteando.set(id);

    try {
      await this.admins.resetearPassword(id);
      await this.alertas.aviso(`Enlace enviado a ${email}`);
    } catch {
      await this.alertas.error(
        'No hemos podido enviarlo',
        'Vuelve a intentarlo. Si sigue fallando, revisa que el correo esté bien configurado.',
      );
    } finally {
      this.reseteando.set('');
    }
  }

  protected async cambiarEstado(id: string, nombre: string, activo: boolean): Promise<void> {
    if (id === this.uidPropio) {
      await this.alertas.error(
        'No puedes desactivarte',
        'Pídele a la otra administradora que lo haga si hace falta.',
      );
      return;
    }

    const confirmado = await this.alertas.confirmar(
      activo ? `¿Reactivar a ${nombre}?` : `¿Desactivar a ${nombre}?`,
      activo
        ? 'Volverá a poder entrar al panel.'
        : 'Dejará de poder entrar al panel. No se borra nada de lo que haya creado.',
      activo ? 'Sí, reactivar' : 'Sí, desactivar',
    );

    if (!confirmado) return;

    try {
      await this.admins.cambiarEstado(id, activo);
      await this.alertas.aviso(activo ? 'Cuenta reactivada' : 'Cuenta desactivada');
    } catch {
      await this.alertas.error('No hemos podido cambiar el estado', 'Inténtalo de nuevo.');
    }
  }
}
