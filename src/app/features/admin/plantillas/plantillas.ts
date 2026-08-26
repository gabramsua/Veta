import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AlertasService } from '../../../core/ui/alertas.service';
import { EditorTexto } from '../../../shared/editor-texto/editor-texto';
import { PLANTILLAS_CONOCIDAS, PlantillasService } from '../../../core/data/plantillas.service';
import { PanelSeccion } from '../../../shared/panel-seccion/panel-seccion';

@Component({
  selector: 'veta-plantillas',
  imports: [ReactiveFormsModule, PanelSeccion, EditorTexto],
  templateUrl: './plantillas.html',
  styleUrl: './plantillas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Plantillas {
  private readonly fb = inject(FormBuilder);
  private readonly servicio = inject(PlantillasService);
  private readonly alertas = inject(AlertasService);

  protected readonly conocidas = PLANTILLAS_CONOCIDAS;
  protected readonly activa = signal(PLANTILLAS_CONOCIDAS[0].id);
  protected readonly guardando = signal(false);

  private readonly guardadas = toSignal(this.servicio.todas().pipe(catchError(() => of([]))), {
    initialValue: [],
  });

  protected readonly formulario = this.fb.nonNullable.group({
    subject: ['', [Validators.required, Validators.maxLength(160)]],
    html: ['', Validators.required],
  });

  protected readonly definicion = computed(
    () => PLANTILLAS_CONOCIDAS.find((p) => p.id === this.activa())!,
  );

  protected readonly personalizada = computed(() =>
    this.guardadas().some((p) => p.id === this.activa()),
  );

  // Las llaves dobles se arman aquí, no en la plantilla: Angular decodifica las
  // entidades HTML antes de buscar interpolaciones, así que `&#123;&#123;` acaba
  // convertido en una interpolación anidada que el parser no sabe leer.
  protected readonly huecos = computed(() =>
    this.definicion().variables.map((variable) => `{{${variable}}}`),
  );

  protected get subject() {
    return this.formulario.controls.subject;
  }

  constructor() {
    // Las plantillas guardadas llegan de forma asíncrona: sin esto, al entrar en
    // la sección el editor salía vacío aunque hubiera una versión personalizada.
    effect(() => {
      const guardada = this.guardadas().find((p) => p.id === this.activa());

      if (this.formulario.pristine) {
        this.formulario.reset(
          { subject: guardada?.subject ?? '', html: guardada?.html ?? '' },
          { emitEvent: false },
        );
      }
    });
  }

  protected seleccionar(id: string): void {
    this.activa.set(id);

    const guardada = this.guardadas().find((p) => p.id === id);
    this.formulario.reset({ subject: guardada?.subject ?? '', html: guardada?.html ?? '' });
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();

    if (this.guardando()) return;

    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      await this.alertas.error('Faltan datos', 'El asunto y el cuerpo son obligatorios.');
      return;
    }

    this.guardando.set(true);

    try {
      const { subject, html } = this.formulario.getRawValue();
      await this.servicio.guardar(this.activa(), subject, html, this.definicion().cuando);
      this.formulario.markAsPristine();
      await this.alertas.aviso('Plantilla guardada');
    } catch {
      await this.alertas.error('No hemos podido guardar', 'Inténtalo de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  // Al borrar la versión guardada se vuelve a la de código.
  protected async restaurar(): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      '¿Volver al texto original?',
      'Se pierden los cambios que hayáis hecho en esta plantilla y se recupera la que viene de serie.',
      'Sí, restaurar',
    );

    if (!confirmado) return;

    await this.servicio.borrar(this.activa());
    this.formulario.reset({ subject: '', html: '' });
    await this.alertas.aviso('Plantilla restaurada');
  }
}
