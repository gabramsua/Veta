import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Imagen } from '../../core/models';
import { Ordenar } from '../ordenar/ordenar';

@Component({
  selector: 'veta-lista-imagenes',
  imports: [Ordenar],
  template: `
    <div class="li">
      @if (imagenes().length === 0) {
        <p class="li__vacio">Todavía no hay imágenes.</p>
      } @else {
        <ul class="li__lista">
          @for (imagen of imagenes(); track imagen.storagePath; let i = $index) {
            <li class="li__item">
              <img class="li__previa" [src]="imagen.url" [alt]="imagen.alt" loading="lazy" />

              <div class="li__datos">
                <p class="li__alt">{{ imagen.alt || 'Sin texto alternativo' }}</p>
                <veta-ordenar
                  nombre="imagen"
                  [primero]="i === 0"
                  [ultimo]="i === imagenes().length - 1"
                  (subir)="mover.emit({ indice: i, direccion: -1 })"
                  (bajar)="mover.emit({ indice: i, direccion: 1 })"
                />
              </div>

              <button
                type="button"
                class="li__quitar"
                [attr.aria-label]="'Quitar imagen ' + (i + 1)"
                (click)="quitar.emit(i)"
              >
                ×
              </button>
            </li>
          }
        </ul>
      }

      <button type="button" class="vt-adm-boton vt-adm-boton--fantasma" (click)="anadir.emit()">
        Añadir imagen
      </button>
    </div>
  `,
  styles: `
    .li {
      display: grid;
      gap: 1.2rem;
      justify-items: start;
    }

    .li__lista {
      display: grid;
      gap: 0.8rem;
      width: 100%;
      padding: 0;
      margin: 0;
      list-style: none;
    }

    .li__item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 1.2rem;
      align-items: center;
      padding: 0.8rem;
      border: 1px solid var(--veta-arena);
      border-radius: 0.4rem;
    }

    .li__previa {
      width: 6.4rem;
      height: 6.4rem;
      object-fit: cover;
      border-radius: 0.2rem;
    }

    .li__datos {
      display: grid;
      gap: 0.4rem;
      justify-items: start;
    }

    .li__alt {
      font-size: 1.3rem;
      color: var(--veta-tinta-suave);
    }

    .li__vacio {
      font-size: 1.3rem;
      color: var(--veta-tinta-suave);
    }

    .li__quitar {
      width: 3.2rem;
      height: 3.2rem;
      font-size: 1.8rem;
      color: var(--veta-tinta-suave);
      border-radius: 999rem;
    }

    .li__quitar:hover {
      color: var(--veta-error);
      background-color: var(--veta-crema);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaImagenes {
  readonly imagenes = input.required<Imagen[]>();
  readonly anadir = output<void>();
  readonly quitar = output<number>();
  readonly mover = output<{ indice: number; direccion: -1 | 1 }>();
}
