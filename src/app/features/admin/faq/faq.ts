import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AlertasService } from '../../../core/ui/alertas.service';
import { EditorTexto } from '../../../shared/editor-texto/editor-texto';
import { EstadoVacio } from '../../../shared/estado-vacio/estado-vacio';
import { Faq } from '../../../core/models';
import { FaqsService } from '../../../core/data/contenido.services';
import { HtmlSeguroPipe } from '../../../shared/html-seguro.pipe';
import { Ordenar } from '../../../shared/ordenar/ordenar';
import { PanelSeccion } from '../../../shared/panel-seccion/panel-seccion';
import { intercambiar, siguienteOrden } from '../../../core/data/orden';

@Component({
  selector: 'veta-faq-admin',
  imports: [ReactiveFormsModule, PanelSeccion, EstadoVacio, Ordenar, EditorTexto, HtmlSeguroPipe],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqAdmin {
  private readonly fb = inject(FormBuilder);
  private readonly faqs = inject(FaqsService);
  private readonly alertas = inject(AlertasService);

  protected readonly lista = toSignal(
    this.faqs.listarOrdenadas().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly editando = signal<Faq | null>(null);
  protected readonly formVisible = signal(false);
  protected readonly guardando = signal(false);
  protected readonly desplegada = signal<string | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    pregunta: ['', [Validators.required, Validators.maxLength(200)]],
    respuesta: ['', Validators.required],
    categoria: [''],
    activa: [true],
  });

  protected readonly tituloForm = computed(() =>
    this.editando() ? 'Editar pregunta' : 'Nueva pregunta',
  );

  protected get pregunta() {
    return this.formulario.controls.pregunta;
  }

  protected alternarDesplegada(id: string): void {
    this.desplegada.update((actual) => (actual === id ? null : id));
  }

  protected abrir(faq?: Faq): void {
    this.editando.set(faq ?? null);

    this.formulario.reset({
      pregunta: faq?.pregunta ?? '',
      respuesta: faq?.respuesta ?? '',
      categoria: faq?.categoria ?? '',
      activa: faq?.activa ?? true,
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
      const faq = this.editando();

      if (faq) {
        await this.faqs.actualizar(faq.id, datos);
      } else {
        await this.faqs.crear({ ...datos, orden: siguienteOrden(this.lista()) });
      }

      this.cerrar();
      await this.alertas.aviso(faq ? 'Pregunta actualizada' : 'Pregunta creada');
    } catch {
      await this.alertas.error('No hemos podido guardar', 'Inténtalo de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  protected async mover(indice: number, direccion: -1 | 1): Promise<void> {
    for (const cambio of intercambiar(this.lista(), indice, direccion)) {
      await this.faqs.actualizar(cambio.id, { orden: cambio.orden });
    }
  }

  protected async alternarActiva(faq: Faq): Promise<void> {
    await this.faqs.actualizar(faq.id, { activa: !faq.activa });
  }

  protected async borrar(faq: Faq): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      '¿Borrar esta pregunta?',
      faq.pregunta,
      'Sí, borrar',
    );

    if (!confirmado) return;

    await this.faqs.borrar(faq.id);
    await this.alertas.aviso('Pregunta borrada');
  }
}
