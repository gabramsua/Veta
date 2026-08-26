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

interface InstanciaJodit {
  value: string;
  events: { on(evento: string, callback: () => void): void };
  destruct(): void;
}

// Jodit toca window en tiempo de import, así que se carga con import() dinámico
// y solo en navegador. Con SSR el textarea de respaldo sigue siendo funcional.
@Component({
  selector: 'veta-editor-texto',
  template: `
    <textarea
      #campo
      class="vt-textarea"
      [value]="valor()"
      [attr.aria-label]="etiqueta()"
      (input)="alEscribirEnTextarea($event)"
      (blur)="alTocar()"
    ></textarea>
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

  private readonly campo = viewChild.required<ElementRef<HTMLTextAreaElement>>('campo');
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
        'link', '|',
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
