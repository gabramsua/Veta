import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AlertasService } from '../../../core/ui/alertas.service';
import { CATEGORIAS_PRODUCTO, CategoriaProducto, Imagen, Producto } from '../../../core/models';
import { EditorTexto } from '../../../shared/editor-texto/editor-texto';
import { EstadoVacio } from '../../../shared/estado-vacio/estado-vacio';
import { ListaImagenes } from '../../../shared/lista-imagenes/lista-imagenes';
import { Ordenar } from '../../../shared/ordenar/ordenar';
import { PanelSeccion } from '../../../shared/panel-seccion/panel-seccion';
import { ProductosService } from '../../../core/data/contenido.services';
import { SelectorMedio } from '../../../shared/selector-medio/selector-medio';
import { intercambiar, siguienteOrden } from '../../../core/data/orden';

@Component({
  selector: 'veta-productos',
  imports: [
    ReactiveFormsModule,
    PanelSeccion,
    EstadoVacio,
    Ordenar,
    ListaImagenes,
    SelectorMedio,
    EditorTexto,
  ],
  templateUrl: './productos.html',
  styleUrl: './productos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Productos {
  private readonly fb = inject(FormBuilder);
  private readonly productos = inject(ProductosService);
  private readonly alertas = inject(AlertasService);

  private readonly selector = viewChild.required(SelectorMedio);

  protected readonly categorias = Object.entries(CATEGORIAS_PRODUCTO) as [
    CategoriaProducto,
    string,
  ][];

  protected readonly lista = toSignal(
    this.productos.listarOrdenados().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly filtroCategoria = signal<'' | CategoriaProducto>('');
  protected readonly editando = signal<Producto | null>(null);
  protected readonly formVisible = signal(false);
  protected readonly guardando = signal(false);
  protected readonly imagenes = signal<Imagen[]>([]);

  protected readonly formulario = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(120)]],
    categoria: ['invitaciones' as CategoriaProducto, Validators.required],
    descripcion: [''],
    precioDesde: [0, [Validators.required, Validators.min(0)]],
    unidad: ['unidad', [Validators.required, Validators.maxLength(30)]],
    destacado: [false],
    activo: [true],
  });

  protected readonly filtrados = computed(() => {
    const categoria = this.filtroCategoria();
    return categoria ? this.lista().filter((p) => p.categoria === categoria) : this.lista();
  });

  protected readonly tituloForm = computed(() =>
    this.editando() ? 'Editar producto' : 'Nuevo producto',
  );

  protected get titulo() {
    return this.formulario.controls.titulo;
  }

  protected nombreCategoria(categoria: CategoriaProducto): string {
    return CATEGORIAS_PRODUCTO[categoria];
  }

  protected cuantosEn(categoria: CategoriaProducto): number {
    return this.lista().filter((p) => p.categoria === categoria).length;
  }

  protected abrir(producto?: Producto): void {
    this.editando.set(producto ?? null);
    this.imagenes.set(producto ? [...producto.imagenes] : []);

    this.formulario.reset({
      titulo: producto?.titulo ?? '',
      categoria: producto?.categoria ?? (this.filtroCategoria() || 'invitaciones'),
      descripcion: producto?.descripcion ?? '',
      precioDesde: producto?.precioDesde ?? 0,
      unidad: producto?.unidad ?? 'unidad',
      destacado: producto?.destacado ?? false,
      activo: producto?.activo ?? true,
    });

    this.formVisible.set(true);
  }

  protected cerrar(): void {
    this.formVisible.set(false);
    this.editando.set(null);
  }

  protected async anadirImagen(): Promise<void> {
    const imagen = await this.selector().elegir();
    if (!imagen) return;

    this.imagenes.update((actuales) => [...actuales, { ...imagen, orden: actuales.length }]);
  }

  protected quitarImagen(indice: number): void {
    this.imagenes.update((actuales) => actuales.filter((_, i) => i !== indice));
  }

  protected moverImagen({ indice, direccion }: { indice: number; direccion: -1 | 1 }): void {
    this.imagenes.update((actuales) => {
      const destino = indice + direccion;
      if (destino < 0 || destino >= actuales.length) return actuales;

      const copia = [...actuales];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia.map((img, i) => ({ ...img, orden: i }));
    });
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();

    if (this.guardando()) return;

    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;

    this.guardando.set(true);

    try {
      const datos = this.formulario.getRawValue();
      const producto = this.editando();
      const payload = { ...datos, imagenes: this.imagenes() };

      if (producto) {
        await this.productos.actualizar(producto.id, payload);
      } else {
        await this.productos.crear({ ...payload, orden: siguienteOrden(this.lista()) });
      }

      this.cerrar();
      await this.alertas.aviso(producto ? 'Producto actualizado' : 'Producto creado');
    } catch {
      await this.alertas.error('No hemos podido guardar', 'Inténtalo de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  // El orden se calcula sobre la lista completa, no sobre la filtrada, para que
  // mover algo con un filtro puesto no descoloque el resto.
  protected async mover(producto: Producto, direccion: -1 | 1): Promise<void> {
    const completa = this.lista();
    const indice = completa.findIndex((p) => p.id === producto.id);

    for (const cambio of intercambiar(completa, indice, direccion)) {
      await this.productos.actualizar(cambio.id, { orden: cambio.orden });
    }
  }

  protected esPrimero(producto: Producto): boolean {
    return this.lista()[0]?.id === producto.id;
  }

  protected esUltimo(producto: Producto): boolean {
    return this.lista()[this.lista().length - 1]?.id === producto.id;
  }

  protected async alternarActivo(producto: Producto): Promise<void> {
    await this.productos.actualizar(producto.id, { activo: !producto.activo });
  }

  protected async alternarDestacado(producto: Producto): Promise<void> {
    await this.productos.actualizar(producto.id, { destacado: !producto.destacado });
  }

  protected async borrar(producto: Producto): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      `¿Borrar «${producto.titulo}»?`,
      'Esta acción no se puede deshacer. Si solo quieres quitarlo de la web, desactívalo.',
      'Sí, borrar',
    );

    if (!confirmado) return;

    await this.productos.borrar(producto.id);
    await this.alertas.aviso('Producto borrado');
  }
}
