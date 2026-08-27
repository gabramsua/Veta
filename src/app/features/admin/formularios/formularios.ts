import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AlertasService } from '../../../core/ui/alertas.service';
import { EstadoVacio } from '../../../shared/estado-vacio/estado-vacio';
import { FORMULARIOS, FormulariosService } from '../../../core/data/formularios.service';
import { Ordenar } from '../../../shared/ordenar/ordenar';
import { PanelSeccion } from '../../../shared/panel-seccion/panel-seccion';
import { PreguntaFormulario, TipoFormulario, TipoPregunta } from '../../../core/models';
import { siguienteOrden } from '../../../core/data/orden';

@Component({
  selector: 'veta-formularios',
  imports: [ReactiveFormsModule, PanelSeccion, EstadoVacio, Ordenar],
  templateUrl: './formularios.html',
  styleUrl: './formularios.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Formularios {
  private readonly fb = inject(FormBuilder);
  private readonly servicio = inject(FormulariosService);
  private readonly alertas = inject(AlertasService);

  protected readonly formularios = FORMULARIOS;
  protected readonly tipos: { valor: TipoPregunta; etiqueta: string }[] = [
    { valor: 'texto', etiqueta: 'Respuesta corta' },
    { valor: 'textarea', etiqueta: 'Respuesta larga' },
    { valor: 'opciones', etiqueta: 'Elegir entre opciones' },
    { valor: 'fecha', etiqueta: 'Fecha' },
  ];

  private readonly todas = toSignal(this.servicio.todas().pipe(catchError(() => of([]))), {
    initialValue: [],
  });

  protected readonly activo = signal<TipoFormulario>('taller');
  protected readonly editando = signal<PreguntaFormulario | null>(null);
  protected readonly formVisible = signal(false);
  protected readonly guardando = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    etiqueta: ['', [Validators.required, Validators.maxLength(160)]],
    tipo: ['texto' as TipoPregunta, Validators.required],
    opciones: [''],
    obligatoria: [false],
    activa: [true],
  });

  protected readonly deEsteFormulario = computed(() =>
    this.todas().filter((p) => p.formulario === this.activo()),
  );

  /**
   * El valor de un `FormControl` no es una señal: un `computed` que lo lea no se
   * vuelve a evaluar cuando cambia, así que el bloque de opciones nunca llegaba a
   * aparecer. Hay que pasar por `valueChanges`, que sí es un stream.
   */
  private readonly tipoElegido = toSignal(this.formulario.controls.tipo.valueChanges, {
    initialValue: this.formulario.controls.tipo.value,
  });

  protected readonly esOpciones = computed(() => this.tipoElegido() === 'opciones');

  protected readonly tituloForm = computed(() =>
    this.editando() ? 'Editar pregunta' : 'Nueva pregunta',
  );

  protected get etiqueta() {
    return this.formulario.controls.etiqueta;
  }

  protected cuantasEn(valor: TipoFormulario): number {
    return this.todas().filter((p) => p.formulario === valor).length;
  }

  protected descripcionActiva(): string {
    return FORMULARIOS.find((f) => f.valor === this.activo())?.descripcion ?? '';
  }

  protected nombreTipo(tipo: TipoPregunta): string {
    return this.tipos.find((t) => t.valor === tipo)?.etiqueta ?? tipo;
  }

  protected abrir(pregunta?: PreguntaFormulario): void {
    this.editando.set(pregunta ?? null);

    this.formulario.reset({
      etiqueta: pregunta?.etiqueta ?? '',
      tipo: pregunta?.tipo ?? 'texto',
      opciones: pregunta?.opciones.join('\n') ?? '',
      obligatoria: pregunta?.obligatoria ?? false,
      activa: pregunta?.activa ?? true,
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
    const opciones = datos.opciones
      .split('\n')
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (datos.tipo === 'opciones' && opciones.length < 2) {
      await this.alertas.error(
        'Faltan opciones',
        'Escribe al menos dos opciones, una en cada línea.',
      );
      return;
    }

    this.guardando.set(true);

    try {
      const pregunta = this.editando();
      const payload = {
        formulario: this.activo(),
        etiqueta: datos.etiqueta,
        tipo: datos.tipo,
        opciones: datos.tipo === 'opciones' ? opciones : [],
        obligatoria: datos.obligatoria,
        activa: datos.activa,
      };

      if (pregunta) {
        await this.servicio.actualizar(pregunta.id, payload);
      } else {
        await this.servicio.crear({ ...payload, orden: siguienteOrden(this.todas()) });
      }

      this.cerrar();
      await this.alertas.aviso(pregunta ? 'Pregunta actualizada' : 'Pregunta añadida');
    } catch {
      await this.alertas.error('No hemos podido guardar', 'Inténtalo de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  protected async mover(pregunta: PreguntaFormulario, direccion: -1 | 1): Promise<void> {
    const lista = this.deEsteFormulario();
    const indice = lista.findIndex((p) => p.id === pregunta.id);
    const vecina = lista[indice + direccion];

    if (!vecina) return;

    await this.servicio.actualizar(pregunta.id, { orden: vecina.orden });
    await this.servicio.actualizar(vecina.id, { orden: pregunta.orden });
  }

  protected esPrimera(pregunta: PreguntaFormulario): boolean {
    return this.deEsteFormulario()[0]?.id === pregunta.id;
  }

  protected esUltima(pregunta: PreguntaFormulario): boolean {
    const lista = this.deEsteFormulario();
    return lista[lista.length - 1]?.id === pregunta.id;
  }

  protected async alternarActiva(pregunta: PreguntaFormulario): Promise<void> {
    await this.servicio.actualizar(pregunta.id, { activa: !pregunta.activa });
  }

  // Las respuestas ya recibidas se guardan por id de pregunta. Si se borra, esas
  // respuestas quedan sin etiqueta en la bandeja.
  protected async borrar(pregunta: PreguntaFormulario): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      '¿Borrar esta pregunta?',
      'Las respuestas que ya hayáis recibido se quedarán sin etiqueta en la bandeja. Si solo quieres dejar de preguntarla, desactívala.',
      'Sí, borrar',
    );

    if (!confirmado) return;

    await this.servicio.borrar(pregunta.id);
    await this.alertas.aviso('Pregunta borrada');
  }
}
