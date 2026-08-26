import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AlertasService } from '../../../core/ui/alertas.service';
import { Bono, CATEGORIAS_TALLER, CategoriaTaller } from '../../../core/models';
import { BonosService } from '../../../core/data/contenido.services';
import { EditorTexto } from '../../../shared/editor-texto/editor-texto';
import { EstadoVacio } from '../../../shared/estado-vacio/estado-vacio';
import { Ordenar } from '../../../shared/ordenar/ordenar';
import { PanelSeccion } from '../../../shared/panel-seccion/panel-seccion';
import { intercambiar, siguienteOrden } from '../../../core/data/orden';

@Component({
  selector: 'veta-bonos',
  imports: [ReactiveFormsModule, PanelSeccion, EstadoVacio, Ordenar, EditorTexto],
  templateUrl: './bonos.html',
  styleUrl: './bonos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bonos {
  private readonly fb = inject(FormBuilder);
  private readonly bonos = inject(BonosService);
  private readonly alertas = inject(AlertasService);

  protected readonly categorias = Object.entries(CATEGORIAS_TALLER) as [CategoriaTaller, string][];

  protected readonly lista = toSignal(
    this.bonos.listarOrdenados().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly editando = signal<Bono | null>(null);
  protected readonly formVisible = signal(false);
  protected readonly guardando = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(120)]],
    categoria: ['ceramica' as CategoriaTaller, Validators.required],
    descripcion: [''],
    precioMes: [0, [Validators.required, Validators.min(0)]],
    sesionesMes: [4, [Validators.required, Validators.min(1), Validators.max(31)]],
    activo: [true],
  });

  protected readonly tituloForm = computed(() => (this.editando() ? 'Editar bono' : 'Nuevo bono'));

  protected get titulo() {
    return this.formulario.controls.titulo;
  }

  protected nombreCategoria(categoria: CategoriaTaller): string {
    return CATEGORIAS_TALLER[categoria];
  }

  protected precioPorSesion(bono: Bono): string {
    if (bono.sesionesMes === 0) return '—';
    return `${(bono.precioMes / bono.sesionesMes).toFixed(2)} € por sesión`;
  }

  protected abrir(bono?: Bono): void {
    this.editando.set(bono ?? null);

    this.formulario.reset({
      titulo: bono?.titulo ?? '',
      categoria: bono?.categoria ?? 'ceramica',
      descripcion: bono?.descripcion ?? '',
      precioMes: bono?.precioMes ?? 0,
      sesionesMes: bono?.sesionesMes ?? 4,
      activo: bono?.activo ?? true,
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
      const bono = this.editando();

      if (bono) {
        await this.bonos.actualizar(bono.id, datos);
      } else {
        await this.bonos.crear({ ...datos, orden: siguienteOrden(this.lista()) });
      }

      this.cerrar();
      await this.alertas.aviso(bono ? 'Bono actualizado' : 'Bono creado');
    } catch {
      await this.alertas.error('No hemos podido guardar', 'Inténtalo de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  protected async mover(indice: number, direccion: -1 | 1): Promise<void> {
    for (const cambio of intercambiar(this.lista(), indice, direccion)) {
      await this.bonos.actualizar(cambio.id, { orden: cambio.orden });
    }
  }

  protected async alternarActivo(bono: Bono): Promise<void> {
    await this.bonos.actualizar(bono.id, { activo: !bono.activo });
  }

  protected async borrar(bono: Bono): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      `¿Borrar «${bono.titulo}»?`,
      'Las solicitudes de bono que ya tengas se conservan, pero perderán la referencia. Si solo quieres ocultarlo, desactívalo.',
      'Sí, borrar',
    );

    if (!confirmado) return;

    await this.bonos.borrar(bono.id);
    await this.alertas.aviso('Bono borrado');
  }
}
