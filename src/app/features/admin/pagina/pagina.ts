import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AlertasService } from '../../../core/ui/alertas.service';
import { CampoPagina, PAGINAS_EDITABLES, PaginaEditable, camposDe } from '../../../core/data/textos';
import { EditorTexto } from '../../../shared/editor-texto/editor-texto';
import { Imagen } from '../../../core/models';
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

  private async cargar(definicion: PaginaEditable): Promise<void> {
    this.cargando.set(true);

    const soloTextos = camposDe(definicion).filter((c) => c.tipo !== 'imagen');

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
      const [textos, imagenes, seo] = await Promise.all([
        firstValueFrom(this.paginas.textos(definicion.slug)),
        firstValueFrom(this.paginas.imagenes(definicion.slug)),
        firstValueFrom(this.paginas.seo(definicion.slug)),
      ]);

      this.formulario.patchValue({ textos, seo });
      this.imagenes.set(imagenes);
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

      await this.paginas.guardar(definicion.slug, valor.textos, this.imagenes(), valor.seo);
      this.formulario.markAsPristine();
      await this.alertas.aviso('Cambios guardados');
    } catch {
      await this.alertas.error('No hemos podido guardar', 'Inténtalo de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }
}
