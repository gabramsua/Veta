import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AJUSTES_POR_DEFECTO } from '../../../core/models';
import { AjustesService } from '../../../core/data/ajustes.service';
import { AlertasService } from '../../../core/ui/alertas.service';

interface Interruptor {
  clave: 'faq' | 'talleres' | 'bonos' | 'liveart' | 'blog' | 'reservas';
  etiqueta: string;
  descripcion: string;
}

@Component({
  selector: 'veta-ajustes',
  imports: [ReactiveFormsModule],
  templateUrl: './ajustes.html',
  styleUrl: './ajustes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ajustes {
  private readonly fb = inject(FormBuilder);
  private readonly servicio = inject(AjustesService);
  private readonly alertas = inject(AlertasService);

  protected readonly guardando = signal(false);

  protected readonly interruptores: Interruptor[] = [
    { clave: 'reservas', etiqueta: 'Reservas de talleres', descripcion: 'Permite solicitar plaza desde la web.' },
    { clave: 'talleres', etiqueta: 'Talleres puntuales', descripcion: 'Muestra la sección de talleres.' },
    { clave: 'bonos', etiqueta: 'Bonos mensuales', descripcion: 'Muestra la sección de bonos.' },
    { clave: 'liveart', etiqueta: 'Live art', descripcion: 'Muestra el servicio de acuarelas en directo.' },
    { clave: 'faq', etiqueta: 'Preguntas frecuentes', descripcion: 'Muestra la página de preguntas.' },
    { clave: 'blog', etiqueta: 'Blog', descripcion: 'Todavía no está desarrollado.' },
  ];

  protected readonly formulario = this.fb.nonNullable.group({
    secciones: this.fb.nonNullable.group({
      faq: [true],
      talleres: [true],
      bonos: [true],
      liveart: [true],
      blog: [false],
      reservas: [true],
    }),
    redes: this.fb.nonNullable.group({
      instagram: [''],
      pinterest: [''],
      facebook: [''],
      tiktok: [''],
    }),
    contacto: this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      direccion: [''],
      horario: [''],
    }),
    avisoGlobal: this.fb.nonNullable.group({
      activo: [false],
      texto: [''],
    }),
  });

  private readonly guardados = toSignal(
    this.servicio.ajustes$.pipe(catchError(() => of(AJUSTES_POR_DEFECTO))),
    { initialValue: AJUSTES_POR_DEFECTO },
  );

  constructor() {
    // Solo se vuelca lo que llega de Firestore si la usuaria no ha empezado a
    // editar, para no pisarle los cambios cuando el stream emita de nuevo.
    effect(() => {
      const datos = this.guardados();
      if (this.formulario.pristine) {
        this.formulario.reset(datos, { emitEvent: false });
      }
    });
  }

  protected get emailContacto() {
    return this.formulario.controls.contacto.controls.email;
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();

    if (this.guardando()) return;

    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      await this.alertas.error('Faltan datos', 'Revisa los campos marcados en rojo.');
      return;
    }

    this.guardando.set(true);

    try {
      await this.servicio.guardar(this.formulario.getRawValue());
      this.formulario.markAsPristine();
      await this.alertas.aviso('Ajustes guardados');
    } catch {
      await this.alertas.error('No hemos podido guardar', 'Inténtalo de nuevo en unos segundos.');
    } finally {
      this.guardando.set(false);
    }
  }
}
