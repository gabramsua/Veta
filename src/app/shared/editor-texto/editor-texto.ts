import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { AlertasService } from '../../core/ui/alertas.service';
import { Imagen } from '../../core/models';
import { SelectorMedio } from '../selector-medio/selector-medio';

/**
 * Los tres anchos que puede tener una imagen dentro de un texto.
 *
 * Son clases y no medidas en línea para que el ancho real lo decida la hoja de
 * estilos de la web: así una imagen insertada hoy se adapta sola si mañana
 * cambia la maquetación.
 */
const TAMANOS = [
  { valor: 'completa', etiqueta: 'Ancho completo' },
  { valor: 'media', etiqueta: 'Mediana' },
  { valor: 'pequena', etiqueta: 'Pequeña' },
];

const ID_ESTILOS_JODIT = 'jodit-css';

// El CSS de Jodit se compila como bundle aparte y se enlaza la primera vez que
// se usa el editor, para no cargarlo en la parte pública.
function cargarEstilosJodit(): void {
  if (document.getElementById(ID_ESTILOS_JODIT)) return;

  const enlace = document.createElement('link');
  enlace.id = ID_ESTILOS_JODIT;
  enlace.rel = 'stylesheet';
  enlace.href = 'jodit.css';
  document.head.appendChild(enlace);
}

interface SeleccionJodit {
  insertHTML(html: string): void;
  save(): unknown;
  restore(): void;
}

interface InstanciaJodit {
  value: string;
  s: SeleccionJodit;
  events: { on(evento: string, callback: () => void): void };
  destruct(): void;
}

// Jodit toca window en tiempo de import, así que se carga con import() dinámico
// y solo en navegador. Con SSR el textarea de respaldo sigue siendo funcional.
@Component({
  selector: 'veta-editor-texto',
  imports: [SelectorMedio],
  template: `
    <textarea
      #campo
      class="vt-textarea"
      [value]="valor()"
      [attr.aria-label]="etiqueta()"
      (input)="alEscribirEnTextarea($event)"
      (blur)="alTocar()"
    ></textarea>

    @if (permiteImagenes()) {
      <veta-selector-medio />
    }
  `,
  styleUrl: './editor-texto.scss',
  // Jodit crea su propio DOM en tiempo de ejecución, así que sus estilos no
  // pueden ir encapsulados. Solo se cargan con el chunk del panel.
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditorTexto),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorTexto implements AfterViewInit, OnDestroy, ControlValueAccessor {
  readonly etiqueta = input('Editor de texto');
  readonly altura = input(320);
  // Se apaga en las plantillas de correo: muchos gestores bloquean las imágenes
  // remotas, así que meterlas ahí promete algo que no siempre se ve.
  readonly permiteImagenes = input(true);

  private readonly campo = viewChild.required<ElementRef<HTMLTextAreaElement>>('campo');
  private readonly selector = viewChild(SelectorMedio);
  private readonly alertas = inject(AlertasService);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly valor = signal('');
  private editor: InstanciaJodit | null = null;
  private deshabilitado = false;

  private alCambiar: (valor: string) => void = () => {};
  private alTocarCampo: () => void = () => {};

  async ngAfterViewInit(): Promise<void> {
    if (!this.esNavegador) return;

    cargarEstilosJodit();

    const { Jodit } = await import('jodit');

    this.editor = Jodit.make(this.campo().nativeElement, {
      height: this.altura(),
      language: 'es',
      toolbarAdaptive: false,
      buttons: [
        'bold', 'italic', 'underline', '|',
        'ul', 'ol', '|',
        'paragraph', '|',
        'link',
        ...(this.permiteImagenes()
          ? [
              {
                name: 'imagenVeta',
                icon: 'image',
                tooltip: 'Insertar una imagen de la biblioteca',
                exec: () => void this.insertarImagen(),
              },
            ]
          : []),
        '|',
        'align', '|',
        'undo', 'redo', '|',
        'eraser', 'source',
      ],
      // Pegar como texto plano evita arrastrar estilos de Word que luego
      // rompen la maquetación de la web.
      askBeforePasteHTML: false,
      defaultActionOnPaste: 'insert_clear_html',
    }) as unknown as InstanciaJodit;

    this.editor.value = this.valor();
    this.editor.events.on('change', () => {
      const nuevo = this.editor?.value ?? '';
      this.valor.set(nuevo);
      this.alCambiar(nuevo);
    });
    this.editor.events.on('blur', () => this.alTocarCampo());
  }

  /**
   * Elige una imagen de la biblioteca y la inserta donde está el cursor.
   *
   * Se guarda la selección antes de abrir el diálogo y se restaura después: al
   * abrirlo, el editor pierde el foco y sin esos marcadores la imagen acabaría
   * al principio del texto en vez de donde estaba escribiendo.
   */
  private async insertarImagen(): Promise<void> {
    const editor = this.editor;
    const selector = this.selector();

    if (!editor || !selector) return;

    editor.s.save();

    const imagen = await selector.elegir();
    if (!imagen) return;

    const tamano = await this.alertas.elegirOpcion('¿De qué tamaño?', TAMANOS, 'completa');
    if (!tamano) return;

    editor.s.restore();
    editor.s.insertHTML(this.htmlDeImagen(imagen, tamano));

    const nuevo = editor.value;
    this.valor.set(nuevo);
    this.alCambiar(nuevo);
  }

  /**
   * El `width` y el `height` son los reales del archivo, no un tamaño de
   * pantalla: el navegador los usa para reservar el hueco antes de descargarla
   * y así la página no da un salto al cargar.
   */
  private htmlDeImagen(imagen: Imagen, tamano: string): string {
    const medidas =
      imagen.width && imagen.height ? ` width="${imagen.width}" height="${imagen.height}"` : '';

    return (
      `<p><img class="bt__imagen bt__imagen--${tamano}" src="${imagen.url}"` +
      ` alt="${this.escapar(imagen.alt)}"${medidas} loading="lazy" decoding="async" /></p>`
    );
  }

  private escapar(valor: string): string {
    return (valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  ngOnDestroy(): void {
    this.editor?.destruct();
    this.editor = null;
  }

  writeValue(valor: string | null): void {
    const texto = valor ?? '';
    this.valor.set(texto);
    if (this.editor) this.editor.value = texto;
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.alCambiar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.alTocarCampo = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado = deshabilitado;
    this.campo().nativeElement.disabled = deshabilitado;
  }

  protected alEscribirEnTextarea(evento: Event): void {
    if (this.editor || this.deshabilitado) return;
    const nuevo = (evento.target as HTMLTextAreaElement).value;
    this.valor.set(nuevo);
    this.alCambiar(nuevo);
  }

  protected alTocar(): void {
    if (!this.editor) this.alTocarCampo();
  }
}
