import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AlertasService } from '../../../core/ui/alertas.service';
import {
  CampoPagina,
  ESTILOS_TEXTO,
  EstiloTexto,
  PAGINAS_EDITABLES,
  PaginaEditable,
  camposDe,
  estilosPorDefecto,
} from '../../../core/data/textos';
import { EditorTexto } from '../../../shared/editor-texto/editor-texto';
import { Imagen, POSICIONES_IMAGEN, PosicionImagen } from '../../../core/models';
import { PaginasService } from '../../../core/data/paginas.service';
import { SelectorMedio } from '../../../shared/selector-medio/selector-medio';

@Component({
  selector: 'veta-pagina',
  imports: [ReactiveFormsModule, RouterLink, EditorTexto, SelectorMedio],
  templateUrl: './pagina.html',
  styleUrl: './pagina.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagina {
  // Llega del parámetro :slug de la ruta.
  readonly slug = input.required<string>();

  private readonly fb = inject(FormBuilder);
  private readonly paginas = inject(PaginasService);
  private readonly alertas = inject(AlertasService);
  private readonly selector = viewChild.required(SelectorMedio);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly imagenes = signal<Record<string, Imagen>>({});

  protected readonly familias = ESTILOS_TEXTO;
  protected readonly posiciones = POSICIONES_IMAGEN;

  /**
   * La familia elegida para cada texto.
   *
   * Va en un signal aparte y no en el formulario reactivo porque los controles
   * se crean al vuelo según la página, y añadir un segundo control por campo
   * complicaba el grupo sin ganar nada: aquí no hay validación que hacer.
   */
  protected readonly estilos = signal<Record<string, EstiloTexto>>({});

  protected readonly definicion = computed<PaginaEditable | undefined>(() =>
    PAGINAS_EDITABLES.find((p) => p.slug === this.slug()),
  );

  protected formulario: FormGroup = this.fb.group({});

  constructor() {
    effect(() => {
      const definicion = this.definicion();
      if (definicion) void this.cargar(definicion);
    });
  }

  protected get seo(): FormGroup {
    return this.formulario.get('seo') as FormGroup;
  }

  protected control(clave: string): FormControl {
    return this.formulario.get(['textos', clave]) as FormControl;
  }

  protected imagen(clave: string): Imagen | null {
    return this.imagenes()[clave] ?? null;
  }

  protected posicionDe(clave: string): PosicionImagen {
    return this.imagenes()[clave]?.posicion ?? 'completa';
  }

  /**
   * La colocación se guarda dentro de la propia imagen, no en un mapa aparte.
   *
   * Así se borra sola cuando se quita la imagen: si viviera en un mapa por
   * clave, quedaría una colocación huérfana apuntando a algo que ya no está.
   */
  protected cambiarPosicion(clave: string, evento: Event): void {
    const posicion = (evento.target as HTMLSelectElement).value as PosicionImagen;

    this.imagenes.update((actuales) => {
      const imagen = actuales[clave];
      if (!imagen) return actuales;

      return { ...actuales, [clave]: { ...imagen, posicion } };
    });

    this.formulario.markAsDirty();
  }

  protected estiloDe(campo: CampoPagina): EstiloTexto {
    return this.estilos()[campo.clave] ?? campo.estiloPorDefecto ?? 'cuerpo';
  }

  protected cambiarEstilo(clave: string, evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value as EstiloTexto;

    this.estilos.update((actuales) => ({ ...actuales, [clave]: valor }));
    this.formulario.markAsDirty();
  }

  private async cargar(definicion: PaginaEditable): Promise<void> {
    this.cargando.set(true);

    const soloTextos = camposDe(definicion).filter((c) => c.tipo !== 'imagen');

    this.estilos.set(estilosPorDefecto(definicion.slug));

    this.formulario = this.fb.group({
      textos: this.fb.group(
        Object.fromEntries(soloTextos.map((c) => [c.clave, this.fb.nonNullable.control('')])),
      ),
      seo: this.fb.group({
        title: this.fb.nonNullable.control('', Validators.maxLength(70)),
        description: this.fb.nonNullable.control('', Validators.maxLength(165)),
        ogImage: this.fb.nonNullable.control(''),
      }),
    });

    try {
      const [textos, imagenes, seo, estilos] = await Promise.all([
        firstValueFrom(this.paginas.textos(definicion.slug)),
        firstValueFrom(this.paginas.imagenes(definicion.slug)),
        firstValueFrom(this.paginas.seo(definicion.slug)),
        firstValueFrom(this.paginas.estilos(definicion.slug)),
      ]);

      this.formulario.patchValue({ textos, seo });
      this.imagenes.set(imagenes);
      this.estilos.set(estilos);
      this.formulario.markAsPristine();
    } catch {
      await this.alertas.error('No hemos podido cargar la página', 'Recarga e inténtalo de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async elegirImagen(campo: CampoPagina): Promise<void> {
    const imagen = await this.selector().elegir();
    if (!imagen) return;

    this.imagenes.update((actuales) => ({ ...actuales, [campo.clave]: imagen }));
    this.formulario.markAsDirty();
  }

  protected quitarImagen(clave: string): void {
    this.imagenes.update((actuales) => {
      const copia = { ...actuales };
      delete copia[clave];
      return copia;
    });

    this.formulario.markAsDirty();
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();

    const definicion = this.definicion();
    if (!definicion || this.guardando()) return;

    this.formulario.markAllAsTouched();

    if (this.formulario.invalid) {
      await this.alertas.error('Revisa los campos', 'Hay algún texto demasiado largo.');
      return;
    }

    this.guardando.set(true);

    try {
      const valor = this.formulario.getRawValue() as {
        textos: Record<string, string>;
        seo: { title: string; description: string; ogImage: string };
      };

      await this.paginas.guardar(
        definicion.slug,
        valor.textos,
        this.imagenes(),
        valor.seo,
        this.estilos(),
      );
      this.formulario.markAsPristine();
      await this.alertas.aviso('Cambios guardados');
    } catch {
      await this.alertas.error('No hemos podido guardar', 'Inténtalo de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }
}
