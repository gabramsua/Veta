import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AlertasService } from '../../../core/ui/alertas.service';
import { EditorTexto } from '../../../shared/editor-texto/editor-texto';
import { PLANTILLAS_CONOCIDAS, PlantillasService } from '../../../core/data/plantillas.service';
import { PlantillaEmail } from '../../../core/models';
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

  /**
   * Las plantillas de serie, traídas del servidor.
   *
   * Si la llamada falla el editor sigue funcionando: se queda en blanco, que es
   * lo que hacía antes. No merece bloquear la sección por esto.
   */
  private readonly porDefecto = signal<PlantillaEmail[]>([]);
  protected readonly cargandoOriginal = signal(true);

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

  protected readonly huecoRespuestas = `{{respuestasHtml}}`;

  protected readonly llevaRespuestas = computed(() =>
    this.definicion().variables.includes('respuestasHtml'),
  );

  protected get subject() {
    return this.formulario.controls.subject;
  }

  constructor() {
    void this.cargarOriginales();

    // Tanto las guardadas como las de serie llegan de forma asíncrona: sin esto,
    // al entrar en la sección el editor salía vacío aunque hubiera texto.
    effect(() => {
      const texto = this.textoDe(this.activa());

      if (this.formulario.pristine) {
        this.formulario.reset(texto, { emitEvent: false });
      }
    });
  }

  private async cargarOriginales(): Promise<void> {
    try {
      this.porDefecto.set(await this.servicio.porDefecto());
    } catch {
      // El editor sigue usable, solo que sin precargar el original.
    } finally {
      this.cargandoOriginal.set(false);
    }
  }

  /**
   * Qué texto se edita: la versión guardada si existe, y si no la de serie.
   *
   * Precargar la de serie es lo que evita el destrozo de antes: quien abría una
   * plantilla sin personalizar veía un cuadro vacío y, al guardar, sustituía el
   * correo bueno por lo que hubiera escrito sin haber leído el original.
   */
  private textoDe(id: string): { subject: string; html: string } {
    const fuente =
      this.guardadas().find((p) => p.id === id) ?? this.porDefecto().find((p) => p.id === id);

    return { subject: fuente?.subject ?? '', html: fuente?.html ?? '' };
  }

  protected seleccionar(id: string): void {
    this.activa.set(id);
    this.formulario.reset(this.textoDe(id));
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

    const original = this.porDefecto().find((p) => p.id === this.activa());
    this.formulario.reset({ subject: original?.subject ?? '', html: original?.html ?? '' });

    await this.alertas.aviso('Plantilla restaurada');
  }
}
