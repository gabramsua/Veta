import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { mensajeDeError } from '../../../core/auth/errores-auth';

@Component({
  selector: 'veta-acceso',
  imports: [ReactiveFormsModule],
  templateUrl: './acceso.html',
  styleUrl: './acceso.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Acceso {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly enviando = signal(false);
  protected readonly error = signal('');
  protected readonly verPassword = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    recordar: [true],
  });

  protected get email() {
    return this.formulario.controls.email;
  }

  protected get password() {
    return this.formulario.controls.password;
  }

  protected alternarPassword(): void {
    this.verPassword.update((v) => !v);
  }

  protected async enviar(evento: Event): Promise<void> {
    evento.preventDefault();

    if (this.enviando()) return;

    this.error.set('');
    this.formulario.markAllAsTouched();

    if (this.formulario.invalid) return;

    this.enviando.set(true);
    const { email, password, recordar } = this.formulario.getRawValue();

    try {
      await this.auth.entrar(email.trim(), password, recordar);
      const volver = new URLSearchParams(location.search).get('volver');
      await this.router.navigateByUrl(volver ?? '/panel/inicio');
    } catch (e) {
      this.error.set(mensajeDeError(e));
      this.password.reset();
    } finally {
      this.enviando.set(false);
    }
  }
}
