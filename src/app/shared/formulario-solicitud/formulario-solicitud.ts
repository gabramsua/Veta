import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';

import { FormulariosService } from '../../core/data/formularios.service';
import { PreguntaFormulario, TipoFormulario } from '../../core/models';

export interface OpcionPieza {
  valor: string;
  etiqueta: string;
}

export interface DatosEnviados {
  nombre: string;
  email: string;
  telefono: string;
  nPersonas: number;
  piezas: string[];
  respuestas: Record<string, string>;
}

@Component({
  selector: 'veta-formulario-solicitud',
  imports: [ReactiveFormsModule],
  templateUrl: './formulario-solicitud.html',
  styleUrl: './formulario-solicitud.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioSolicitud {
  readonly formulario = input.required<TipoFormulario>();
  readonly pedirPersonas = input(false);
  readonly maxPersonas = input(20);
  readonly textoBoton = input('Enviar solicitud');
  readonly enviando = input(false);

  /**
   * Casillas de selección múltiple que van antes de las preguntas configurables.
   *
   * Vacío en casi todos los formularios. Se usa en papelería, donde saber qué
   * piezas quiere la clienta es la mitad del presupuesto, y no puede resolverse
   * con una pregunta del panel porque esas son de respuesta única y no se
   * pueden premarcar según la página de la que se venga.
   */
  readonly opcionesPiezas = input<OpcionPieza[]>([]);
  readonly etiquetaPiezas = input('¿Qué necesitáis?');
  readonly piezasIniciales = input<string[]>([]);

  readonly enviado = output<DatosEnviados>();

  private readonly fb = inject(FormBuilder);
  private readonly servicio = inject(FormulariosService);

  protected readonly preguntas = toSignal(
    toObservable(this.formulario).pipe(
      switchMap((tipo) => this.servicio.activasDe(tipo).pipe(catchError(() => of([])))),
      catchError(() => of([] as PreguntaFormulario[])),
    ),
    { initialValue: [] as PreguntaFormulario[] },
  );

  protected readonly grupo = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    telefono: ['', [Validators.required, Validators.maxLength(30)]],
    nPersonas: [1, [Validators.min(1), Validators.max(20)]],
    privacidad: [false, Validators.requiredTrue],
    // Campo trampa: los bots rellenan todo lo que encuentran. Una persona no lo
    // ve, así que si llega con contenido, se descarta el envío en silencio.
    web: [''],
  });

  /**
   * Las preguntas extra no van en el formulario reactivo.
   *
   * Llegan de Firestore de forma asíncrona, y crear y destruir controles al
   * vuelo hace que la plantilla intente pintar un `formControlName` que todavía
   * no existe. Un mapa en un signal evita el problema entero.
   */
  protected readonly respuestas = signal<Record<string, string>>({});
  protected readonly faltan = signal<string[]>([]);
  protected readonly intentado = signal(false);
  protected readonly piezasElegidas = signal<string[]>([]);
  protected readonly fechasPasadas = signal<string[]>([]);

  /**
   * Hoy, en formato `2027-06-12`, para el atributo `min` de los campos de fecha.
   *
   * Se arma con las partes locales en vez de con `toISOString()`, que convierte
   * a UTC: a partir de las 22:00 en España daría el día siguiente y el
   * calendario bloquearía hoy.
   */
  protected readonly hoyIso = (() => {
    const ahora = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}`;
  })();

  protected readonly pidePiezas = computed(() => this.opcionesPiezas().length > 0);
  protected readonly faltanPiezas = computed(
    () => this.pidePiezas() && this.piezasElegidas().length === 0,
  );

  protected readonly nombre = this.grupo.controls.nombre;
  protected readonly email = this.grupo.controls.email;
  protected readonly telefono = this.grupo.controls.telefono;
  protected readonly privacidad = this.grupo.controls.privacidad;

  // `grupo.invalid` tampoco es una señal. Aquí funcionaba de rebote porque el
  // aviso solo aparece tras pulsar enviar, y entonces cambian `intentado` y
  // `faltan`. Mejor no depender de esa casualidad.
  private readonly estadoGrupo = toSignal(this.grupo.statusChanges, {
    initialValue: this.grupo.status,
  });

  protected readonly hayErrores = computed(
    () =>
      this.intentado() &&
      (this.estadoGrupo() === 'INVALID' ||
        this.faltan().length > 0 ||
        this.faltanPiezas() ||
        this.fechasPasadas().length > 0),
  );

  constructor() {
    // La preselección llega del parámetro de la URL, que en SSR puede resolverse
    // después del primer render. Se aplica sola, pero sin pisar lo que ya haya
    // marcado la clienta.
    effect(() => {
      const iniciales = this.piezasIniciales();

      if (iniciales.length > 0 && this.piezasElegidas().length === 0) {
        this.piezasElegidas.set([...iniciales]);
      }
    });
  }

  protected piezaMarcada(valor: string): boolean {
    return this.piezasElegidas().includes(valor);
  }

  protected alternarPieza(valor: string): void {
    this.piezasElegidas.update((actuales) =>
      actuales.includes(valor) ? actuales.filter((x) => x !== valor) : [...actuales, valor],
    );
  }

  protected valor(id: string): string {
    return this.respuestas()[id] ?? '';
  }

  protected falta(id: string): boolean {
    return this.faltan().includes(id);
  }

  protected esPasada(id: string): boolean {
    return this.fechasPasadas().includes(id);
  }

  protected actualizar(id: string, evento: Event): void {
    const valor = (evento.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;

    this.respuestas.update((actuales) => ({ ...actuales, [id]: valor }));

    if (this.falta(id) && valor.trim().length > 0) {
      this.faltan.update((ids) => ids.filter((x) => x !== id));
    }

    if (this.esPasada(id)) {
      this.fechasPasadas.update((ids) => ids.filter((x) => x !== id));
    }
  }

  protected enviar(evento: Event): void {
    evento.preventDefault();

    if (this.enviando()) return;

    this.intentado.set(true);
    this.grupo.markAllAsTouched();

    const sinResponder = this.preguntas()
      .filter((p) => p.obligatoria && this.valor(p.id).trim().length === 0)
      .map((p) => p.id);

    this.faltan.set(sinResponder);

    /**
     * El `min` del input solo desanima: el calendario no deja elegir antes de
     * hoy, pero el campo se puede escribir a mano y un formulario se puede
     * enviar sin navegador. Como las reglas de Firestore no pueden mirar dentro
     * del mapa de respuestas, esta es la última comprobación que hay.
     *
     * Las fechas ISO se comparan como cadenas sin problema: están ordenadas de
     * más significativo a menos.
     */
    const pasadas = this.preguntas()
      .filter((p) => p.tipo === 'fecha')
      .filter((p) => {
        const valor = this.valor(p.id).trim();
        return valor.length > 0 && valor < this.hoyIso;
      })
      .map((p) => p.id);

    this.fechasPasadas.set(pasadas);

    // Honeypot: se finge que todo ha ido bien para no darle pistas al bot.
    if (this.grupo.controls.web.value.trim().length > 0) return;

    if (this.grupo.invalid || sinResponder.length > 0 || this.faltanPiezas()) return;
    if (pasadas.length > 0) return;

    const valores = this.grupo.getRawValue();

    this.enviado.emit({
      nombre: valores.nombre.trim(),
      email: valores.email.trim().toLowerCase(),
      telefono: valores.telefono.trim(),
      nPersonas: this.pedirPersonas() ? valores.nPersonas : 1,
      piezas: this.piezasElegidas(),
      respuestas: this.respuestasConEtiqueta(),
    });
  }

  // Se guarda la etiqueta junto a la respuesta: si mañana se borra la pregunta,
  // la bandeja sigue sabiendo a qué contestaba cada cosa.
  private respuestasConEtiqueta(): Record<string, string> {
    const salida: Record<string, string> = {};

    for (const pregunta of this.preguntas()) {
      const valor = this.valor(pregunta.id).trim();
      if (valor.length === 0) continue;

      salida[pregunta.id] = valor;
      salida[`${pregunta.id}__etiqueta`] = pregunta.etiqueta;
    }

    return salida;
  }

  reiniciar(): void {
    this.grupo.reset({ nombre: '', email: '', telefono: '', nPersonas: 1, privacidad: false, web: '' });
    this.respuestas.set({});
    this.faltan.set([]);
    this.fechasPasadas.set([]);
    this.intentado.set(false);
    this.piezasElegidas.set([...this.piezasIniciales()]);
  }
}
