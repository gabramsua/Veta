import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AlertasService } from '../../../core/ui/alertas.service';
import { CATEGORIAS_TALLER, CategoriaTaller, Imagen, Taller } from '../../../core/models';
import { EditorTexto } from '../../../shared/editor-texto/editor-texto';
import { EstadoVacio } from '../../../shared/estado-vacio/estado-vacio';
import { ListaImagenes } from '../../../shared/lista-imagenes/lista-imagenes';
import { Ordenar } from '../../../shared/ordenar/ordenar';
import { PanelSeccion } from '../../../shared/panel-seccion/panel-seccion';
import { SelectorMedio } from '../../../shared/selector-medio/selector-medio';
import { SesionesService, TalleresService } from '../../../core/data/contenido.services';
import { intercambiar, siguienteOrden } from '../../../core/data/orden';

@Component({
  selector: 'veta-talleres',
  imports: [
    ReactiveFormsModule,
    PanelSeccion,
    EstadoVacio,
    Ordenar,
    ListaImagenes,
    SelectorMedio,
    EditorTexto,
  ],
  templateUrl: './talleres.html',
  styleUrl: './talleres.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Talleres {
  private readonly fb = inject(FormBuilder);
  private readonly talleres = inject(TalleresService);
  private readonly sesiones = inject(SesionesService);
  private readonly alertas = inject(AlertasService);

  private readonly selector = viewChild.required(SelectorMedio);

  protected readonly categorias = Object.entries(CATEGORIAS_TALLER) as [CategoriaTaller, string][];

  protected readonly lista = toSignal(
    this.talleres.listarOrdenados().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  private readonly todasLasSesiones = toSignal(
    this.sesiones.listarPorFecha().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly editando = signal<Taller | null>(null);
  protected readonly formVisible = signal(false);
  protected readonly guardando = signal(false);
  protected readonly imagenes = signal<Imagen[]>([]);

  protected readonly formulario = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(120)]],
    categoria: ['ceramica' as CategoriaTaller, Validators.required],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(0)]],
    duracionMin: [90, [Validators.required, Validators.min(15)]],
    activo: [true],
  });

  protected readonly tituloForm = computed(() =>
    this.editando() ? 'Editar taller' : 'Nuevo taller',
  );

  protected get titulo() {
    return this.formulario.controls.titulo;
  }

  protected get duracion() {
    return this.formulario.controls.duracionMin;
  }

  /**
   * Duraciones habituales de un taller, para no obligar a teclear minutos.
   *
   * Cubren el 95 % de los casos; para el resto queda el campo numérico, que
   * solo aparece si la duración no es ninguna de estas.
   */
  protected readonly duracionesFrecuentes = [
    { minutos: 60, etiqueta: '1 h' },
    { minutos: 90, etiqueta: '1 h 30' },
    { minutos: 120, etiqueta: '2 h' },
    { minutos: 150, etiqueta: '2 h 30' },
    { minutos: 180, etiqueta: '3 h' },
  ];

  private readonly duracionElegida = toSignal(this.formulario.controls.duracionMin.valueChanges, {
    initialValue: this.formulario.controls.duracionMin.value,
  });

  protected readonly duracionALaCarta = computed(
    () => !this.duracionesFrecuentes.some((d) => d.minutos === this.duracionElegida()),
  );

  protected esDuracion(minutos: number): boolean {
    return this.duracionElegida() === minutos;
  }

  protected ponerDuracion(minutos: number): void {
    this.duracion.setValue(minutos);
    this.duracion.markAsDirty();
  }

  /** «1 h 30», no «90 minutos»: nadie piensa la duración de un taller en minutos. */
  protected enHoras(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;

    if (horas === 0) return `${resto} min`;
    if (resto === 0) return `${horas} h`;

    return `${horas} h ${resto} min`;
  }

  protected sesionesDe(workshopId: string): number {
    return this.todasLasSesiones().filter((s) => s.workshopId === workshopId).length;
  }

  protected nombreCategoria(categoria: CategoriaTaller): string {
    return CATEGORIAS_TALLER[categoria];
  }

  protected abrir(taller?: Taller): void {
    this.editando.set(taller ?? null);
    this.imagenes.set(taller ? [...taller.imagenes] : []);

    this.formulario.reset({
      titulo: taller?.titulo ?? '',
      categoria: taller?.categoria ?? 'ceramica',
      descripcion: taller?.descripcion ?? '',
      precio: taller?.precio ?? 0,
      duracionMin: taller?.duracionMin ?? 90,
      activo: taller?.activo ?? true,
    });

    this.formVisible.set(true);
  }

  protected cerrar(): void {
    this.formVisible.set(false);
    this.editando.set(null);
  }

  /**
   * La direcci\u00f3n se genera sola a partir del t\u00edtulo.
   *
   * Antes era un campo del formulario, pero no lo lee nadie: ninguna ruta
   * p\u00fablica usa el slug de un taller. Ped\u00edrselo a Carmen era una pregunta sin
   * consecuencias, y una m\u00e1s en un formulario ya largo.
   *
   * Se sigue guardando por si alg\u00fan d\u00eda hay una p\u00e1gina por taller, y se le
   * a\u00f1ade un sufijo si dos talleres coinciden en t\u00edtulo.
   */
  private slugDesdeTitulo(titulo: string, idActual?: string): string {
    const base =
      titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'taller';

    const ocupado = (valor: string) =>
      this.lista().some((t) => t.slug === valor && t.id !== idActual);

    if (!ocupado(base)) return base;

    let sufijo = 2;
    while (ocupado(`${base}-${sufijo}`)) sufijo += 1;

    return `${base}-${sufijo}`;
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

    const datos = {
      ...this.formulario.getRawValue(),
      slug: this.slugDesdeTitulo(this.titulo.value, this.editando()?.id),
    };

    this.guardando.set(true);

    try {
      const taller = this.editando();
      const payload = { ...datos, imagenes: this.imagenes() };

      if (taller) {
        await this.talleres.actualizar(taller.id, payload);
      } else {
        await this.talleres.crear({ ...payload, orden: siguienteOrden(this.lista()) });
      }

      this.cerrar();
      await this.alertas.aviso(taller ? 'Taller actualizado' : 'Taller creado');
    } catch {
      await this.alertas.error('No hemos podido guardar', 'Inténtalo de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  protected async mover(indice: number, direccion: -1 | 1): Promise<void> {
    for (const cambio of intercambiar(this.lista(), indice, direccion)) {
      await this.talleres.actualizar(cambio.id, { orden: cambio.orden });
    }
  }

  protected async alternarActivo(taller: Taller): Promise<void> {
    await this.talleres.actualizar(taller.id, { activo: !taller.activo });
  }

  protected async borrar(taller: Taller): Promise<void> {
    const conSesiones = this.sesionesDe(taller.id);

    if (conSesiones > 0) {
      await this.alertas.error(
        'Este taller tiene sesiones',
        `Hay ${conSesiones} sesión(es) programada(s). Bórralas primero, o desactiva el taller para ocultarlo sin perder nada.`,
      );
      return;
    }

    const confirmado = await this.alertas.confirmar(
      `¿Borrar «${taller.titulo}»?`,
      'Esta acción no se puede deshacer. Si solo quieres ocultarlo, desactívalo.',
      'Sí, borrar',
    );

    if (!confirmado) return;

    await this.talleres.borrar(taller.id);
    await this.alertas.aviso('Taller borrado');
  }
}
