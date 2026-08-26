import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AlertasService } from '../../../core/ui/alertas.service';
import { EstadoVacio } from '../../../shared/estado-vacio/estado-vacio';
import { Frase } from '../../../core/models';
import { FrasesService } from '../../../core/data/contenido.services';
import { Ordenar } from '../../../shared/ordenar/ordenar';
import { PanelSeccion } from '../../../shared/panel-seccion/panel-seccion';
import { intercambiar, siguienteOrden } from '../../../core/data/orden';

@Component({
  selector: 'veta-frases',
  imports: [ReactiveFormsModule, PanelSeccion, EstadoVacio, Ordenar],
  templateUrl: './frases.html',
  styleUrl: './frases.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Frases {
  private readonly fb = inject(FormBuilder);
  private readonly frases = inject(FrasesService);
  private readonly alertas = inject(AlertasService);

  protected readonly lista = toSignal(
    this.frases.listarOrdenadas().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly editando = signal<Frase | null>(null);
  protected readonly formVisible = signal(false);
  protected readonly guardando = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    texto: ['', [Validators.required, Validators.maxLength(1200)]],
    autor: ['', [Validators.required, Validators.maxLength(80)]],
    contexto: ['', Validators.maxLength(120)],
    activa: [true],
  });

  protected readonly tituloForm = computed(() =>
    this.editando() ? 'Editar testimonio' : 'Nuevo testimonio',
  );

  protected get texto() {
    return this.formulario.controls.texto;
  }

  protected get autor() {
    return this.formulario.controls.autor;
  }

  protected abrir(frase?: Frase): void {
    this.editando.set(frase ?? null);

    this.formulario.reset({
      texto: frase?.texto ?? '',
      autor: frase?.autor ?? '',
      contexto: frase?.contexto ?? '',
      activa: frase?.activa ?? true,
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

    this.guardando.set(true);

    try {
      const datos = this.formulario.getRawValue();
      const frase = this.editando();

      if (frase) {
        await this.frases.actualizar(frase.id, datos);
      } else {
        await this.frases.crear({ ...datos, orden: siguienteOrden(this.lista()) });
      }

      this.cerrar();
      await this.alertas.aviso(frase ? 'Testimonio actualizado' : 'Testimonio creado');
    } catch {
      await this.alertas.error('No hemos podido guardar', 'Inténtalo de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  protected async mover(indice: number, direccion: -1 | 1): Promise<void> {
    for (const cambio of intercambiar(this.lista(), indice, direccion)) {
      await this.frases.actualizar(cambio.id, { orden: cambio.orden });
    }
  }

  protected async alternarActiva(frase: Frase): Promise<void> {
    await this.frases.actualizar(frase.id, { activa: !frase.activa });
  }

  protected async borrar(frase: Frase): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      '¿Borrar este testimonio?',
      `De ${frase.autor}`,
      'Sí, borrar',
    );

    if (!confirmado) return;

    await this.frases.borrar(frase.id);
    await this.alertas.aviso('Testimonio borrado');
  }
}
