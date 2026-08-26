import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AlertasService } from '../../../core/ui/alertas.service';
import { DialogoService } from '../../../shared/dialogo/dialogo';
import { CategoriasMedioService, ErrorSubida, MediosService } from '../../../core/data/medios.service';
import { EstadoVacio } from '../../../shared/estado-vacio/estado-vacio';
import { Medio } from '../../../core/models';
import { PanelSeccion } from '../../../shared/panel-seccion/panel-seccion';
import { siguienteOrden } from '../../../core/data/orden';

@Component({
  selector: 'veta-medios',
  imports: [FormsModule, PanelSeccion, EstadoVacio],
  templateUrl: './medios.html',
  providers: [DialogoService],
  styleUrl: './medios.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Medios {
  private readonly medios = inject(MediosService);
  private readonly categorias = inject(CategoriasMedioService);
  private readonly alertas = inject(AlertasService);
  private readonly dialogo = inject(DialogoService);

  protected readonly lista = toSignal(
    this.medios.listarRecientes().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly listaCategorias = toSignal(
    this.categorias.listarOrdenadas().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly filtroCategoria = signal('');
  protected readonly filtroTipo = signal<'' | 'imagen' | 'pdf'>('');
  protected readonly busqueda = signal('');

  protected readonly subiendo = signal(false);
  protected readonly progreso = signal('');
  protected readonly ampliado = signal<Medio | null>(null);

  protected readonly formCategoriaAbierto = signal(false);
  protected readonly nombreCategoriaNueva = signal('');

  protected readonly filtrados = computed(() => {
    const categoria = this.filtroCategoria();
    const tipo = this.filtroTipo();
    const texto = this.busqueda().trim().toLowerCase();

    return this.lista().filter(
      (m) =>
        (!categoria || m.categoriaId === categoria) &&
        (!tipo || m.tipo === tipo) &&
        (!texto || m.nombre.toLowerCase().includes(texto) || m.alt.toLowerCase().includes(texto)),
    );
  });

  protected async subirArchivos(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivos = Array.from(input.files ?? []);

    if (archivos.length === 0) return;

    this.subiendo.set(true);
    const fallos: string[] = [];

    for (const [indice, archivo] of archivos.entries()) {
      this.progreso.set(`Subiendo ${indice + 1} de ${archivos.length}…`);

      try {
        await this.medios.subir(archivo, this.filtroCategoria() || null, '');
      } catch (e) {
        fallos.push(`${archivo.name}: ${e instanceof ErrorSubida ? e.message : 'error al subir'}`);
      }
    }

    this.subiendo.set(false);
    this.progreso.set('');
    input.value = '';

    if (fallos.length === 0) {
      await this.alertas.aviso(
        archivos.length === 1 ? 'Archivo subido' : `${archivos.length} archivos subidos`,
      );
    } else {
      await this.alertas.error('Algunos archivos no se han subido', fallos.join('\n'));
    }
  }

  // El texto alternativo y la categoría se editan en la propia tarjeta y se
  // guardan al salir del campo: son cambios de un solo dato, no merecen un modal.
  protected async guardarAlt(medio: Medio, evento: Event): Promise<void> {
    const alt = (evento.target as HTMLInputElement).value.trim();
    if (alt === medio.alt) return;

    await this.medios.actualizar(medio.id, { alt });
    await this.alertas.aviso('Texto alternativo guardado');
  }

  protected async cambiarCategoria(medio: Medio, evento: Event): Promise<void> {
    const valor = (evento.target as HTMLSelectElement).value;
    await this.medios.actualizar(medio.id, { categoriaId: valor || null });
  }

  protected async borrar(medio: Medio): Promise<void> {
    const confirmado = await this.alertas.confirmar(
      `¿Borrar «${medio.nombre}»?`,
      'Se borra también el archivo. Si está usado en alguna página, ahí dejará de verse.',
      'Sí, borrar',
    );

    if (!confirmado) return;

    try {
      await this.medios.borrarConArchivo(medio);
      await this.alertas.aviso('Archivo borrado');
    } catch {
      await this.alertas.error('No hemos podido borrarlo', 'Inténtalo de nuevo.');
    }
  }

  protected abrirFormCategoria(): void {
    this.nombreCategoriaNueva.set('');
    this.formCategoriaAbierto.set(true);
  }

  protected cerrarFormCategoria(): void {
    this.formCategoriaAbierto.set(false);
  }

  protected async crearCategoria(evento: Event): Promise<void> {
    evento.preventDefault();

    const nombre = this.nombreCategoriaNueva().trim();
    if (!nombre) return;

    await this.categorias.crear({
      nombre,
      slug: nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      orden: siguienteOrden(this.listaCategorias()),
    });

    this.cerrarFormCategoria();
    await this.alertas.aviso('Categoría creada');
  }

  protected async borrarCategoria(id: string, nombre: string): Promise<void> {
    const enUso = this.lista().filter((m) => m.categoriaId === id).length;

    const confirmado = await this.alertas.confirmar(
      `¿Borrar la categoría «${nombre}»?`,
      enUso > 0
        ? `${enUso} archivo(s) la están usando. No se borran, pero se quedan sin categoría.`
        : 'No la está usando ningún archivo.',
      'Sí, borrar',
    );

    if (!confirmado) return;

    await this.categorias.borrar(id);

    if (this.filtroCategoria() === id) this.filtroCategoria.set('');
  }

  protected ampliar(medio: Medio): void {
    this.ampliado.set(medio);
    this.dialogo.abrir(() => this.ampliado.set(null));
  }

  protected cerrarAmpliado(): void {
    this.ampliado.set(null);
    this.dialogo.cerrar();
  }

  protected enMegas(bytes: number): string {
    return bytes < 1024 * 1024
      ? `${Math.round(bytes / 1024)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
