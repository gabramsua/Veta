import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { DialogoService } from '../dialogo/dialogo';
import { ErrorSubida, MediosService } from '../../core/data/medios.service';
import { Imagen, Medio } from '../../core/models';

// Diálogo para elegir una imagen de la biblioteca, o subir una nueva sin salir
// del formulario. Devuelve el objeto Imagen ya listo para guardar.
@Component({
  selector: 'veta-selector-medio',
  imports: [FormsModule],
  templateUrl: './selector-medio.html',
  styleUrl: './selector-medio.scss',
  providers: [DialogoService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorMedio {
  private readonly medios = inject(MediosService);
  private readonly dialogo = inject(DialogoService);

  private readonly abierto = signal(false);
  private resolver: ((imagen: Imagen | null) => void) | null = null;

  protected readonly busqueda = signal('');
  protected readonly subiendo = signal(false);
  protected readonly error = signal('');

  protected readonly visible = this.abierto.asReadonly();

  private readonly lista = toSignal(
    this.medios.listarRecientes().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  protected readonly imagenes = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();

    return this.lista().filter(
      (m) => m.tipo === 'imagen' && (!texto || m.nombre.toLowerCase().includes(texto)),
    );
  });

  elegir(): Promise<Imagen | null> {
    this.busqueda.set('');
    this.error.set('');
    this.abierto.set(true);
    this.dialogo.abrir(() => this.cerrar(null));

    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  protected cerrar(imagen: Imagen | null): void {
    this.abierto.set(false);
    this.dialogo.cerrar();
    this.resolver?.(imagen);
    this.resolver = null;
  }

  protected seleccionar(medio: Medio): void {
    this.cerrar({
      url: medio.url,
      storagePath: medio.storagePath,
      alt: medio.alt || medio.nombre,
      orden: 0,
      width: medio.width,
      height: medio.height,
    });
  }

  protected async subirYSeleccionar(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) return;

    this.subiendo.set(true);
    this.error.set('');

    try {
      const id = await this.medios.subir(archivo, null, '');
      const nuevo = this.lista().find((m) => m.id === id);

      if (nuevo) {
        this.seleccionar(nuevo);
      } else {
        // El stream aún no ha emitido el documento recién creado.
        this.error.set('Subida correcta. Búscala en la lista y selecciónala.');
      }
    } catch (e) {
      this.error.set(e instanceof ErrorSubida ? e.message : 'No hemos podido subir el archivo.');
    } finally {
      this.subiendo.set(false);
      input.value = '';
    }
  }
}
