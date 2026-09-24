# Plan de implementación

Siete fases. Al terminar cada una se para para poder probar antes de continuar.

---

## Fase 1 · Andamiaje ✅

Proyecto Angular 20 con SSR, conexión a Firebase, sistema de estilos, layouts
público y de panel, modelos de datos y reglas de seguridad.

**Entregado**

- Proyecto Angular 20 standalone con SSR (`@angular/build:application`, `outputMode: server`).
- `provideFirebaseApp` / `provideAuth` / `provideFirestore` / `provideStorage`.
- Tokens de estilo con la paleta de la carta de color y la fuente Laima convertida a webfont.
- Layout público: cabecera con menú de dos niveles, menú móvil a pantalla completa, pie con cuatro columnas.
- Layout del panel: barra lateral con grupos desplegables, topbar y acceso directo a la web pública.
- Home con la secuencia de bloques definida en `CLAUDE.md` §3, con marcadores de imagen.
- Resto de secciones públicas como placeholder con cabecera propia.
- `firestore.rules` con validación de esquema en `bookings` y `requests`.
- `storage.rules` con límites de tamaño y tipo MIME.
- Índices compuestos de Firestore declarados.

**Decisiones tomadas**

| Decisión | Motivo |
|---|---|
| `RenderMode.Server` en la parte pública, `RenderMode.Client` en `/panel` y `/acceso` | El contenido viene de Firestore y cambia desde el panel. Prerenderizar lo congelaría en el momento del build. |
| Fuentes en `.woff` en lugar de `.woff2` | La conversión a woff2 necesita Brotli, que no estaba disponible. `.woff` funciona en todos los navegadores. Regenerar a woff2 es una mejora pendiente (ver `pendientes.md`, D-fuentes). |
| `tokens.scss` sin salida CSS | Permite `@use 'tokens'` desde cualquier componente sin duplicar las custom properties en cada hoja de estilos. |
| Ruta comodín dentro del layout público | El 404 conserva cabecera y pie. Obliga a declarar `/acceso` y `/panel` antes en el array de rutas. |
| Sin Angular Material todavía | Solo se usará en el panel, a partir de la fase 2. No lastra el bundle de la parte pública. |

---

## Fase 2 · Autenticación y panel ✅

**Entregado**

- `AuthService` con signals, persistencia seleccionable y lectura del claim `admin`.
- `authGuard` e `invitadoGuard`. Ambos esperan a que Firebase resuelva el estado inicial.
- Login en `/acceso` con formulario reactivo, mostrar/ocultar contraseña y errores en español.
- `ColeccionBase`: acceso tipado a Firestore para que los componentes no lo toquen.
- `AlertasService` sobre SweetAlert2, tematizado y con carga diferida.
- Functions `createAdminUser` y `setAdminEnabled`.
- CRUD de administradoras y ajustes del sitio.
- Wrapper de Jodit con `ControlValueAccessor` y pipe `htmlSeguro`.

**Decisiones tomadas**

| Decisión | Motivo |
|---|---|
| El guard espera a `cargando === false` antes de decidir | Firebase restaura la sesión de forma asíncrona. Sin la espera, recargar dentro del panel expulsa al login aunque la sesión sea válida. |
| El permiso vive en un custom claim, no en el documento `admins/` | Las reglas de Firestore pueden leer el claim del token sin hacer una lectura extra. Un documento se podría manipular; el claim no. |
| `setAdminEnabled` revoca los refresh tokens | Sin revocarlos, una administradora desactivada seguiría dentro hasta una hora, que es lo que dura el token. |
| Firebase no distingue «correo inexistente» de «contraseña incorrecta» | Es a propósito: distinguirlos permitiría averiguar qué correos están registrados. Se muestra el mismo mensaje para ambos. |
| El CSS de Jodit se compila como bundle aparte con `inject: false` | Son ~100 kB que no deben viajar en la parte pública. El componente enlaza la hoja al inicializarse. |
| Contraseña inicial visible en el alta, no enviada por correo | Firebase no permite fijar contraseña y enviar invitación en un solo paso sin plantilla de correo. Se muestra para pasarla por un canal seguro. Ver P10 en `pendientes.md`. |
| `**` dentro de `/panel` con pantalla «en construcción» | El menú lateral ya enlaza secciones de fases posteriores. Sin esto, esas rutas caían en el 404 público, con cabecera y pie de la web. |

## Fase 3 · Contenido ✅

**Entregado**

- Biblioteca de medios con subida múltiple a Storage, categorías, filtros, galería y lightbox.
- Selector de imágenes reutilizable: elige de la biblioteca o sube sin salir del formulario.
- Talleres y sesiones, bonos, productos de papelería, portfolio, FAQ y testimonios.
- Componentes compartidos que evitan repetir el mismo CRUD ocho veces.

**Decisiones tomadas**

| Decisión | Motivo |
|---|---|
| Subir y bajar en vez de arrastrar y soltar | Funciona con teclado, con lector de pantalla y en móvil, sin añadir ninguna librería. Arrastrar es más vistoso pero solo sirve con ratón. |
| El orden se guarda sobre la lista completa, no sobre la filtrada | Reordenar con un filtro puesto descolocaría el resto de elementos sin que se vea. |
| Al borrar un medio, primero el archivo y luego la ficha | Si falla el borrado del binario, es preferible un huérfano en Storage que una ficha apuntando a un archivo que ya no existe. |
| Borrar un taller con sesiones está bloqueado | El botón de desactivar cubre el caso real («ya no lo hacemos»). Borrar dejaría sesiones apuntando a la nada. |
| No se puede bajar las plazas por debajo de las confirmadas | Evita dejar una sesión sobrevendida por un descuido al editar. |
| Dos sesiones del mismo taller no pueden solaparse | Son las mismas manos y el mismo espacio. Se avisa y se bloquea el guardado. |
| El texto alternativo y la categoría se editan en la propia tarjeta | Son cambios de un solo dato: abrir un modal para eso sobra. |
| El portfolio referencia medios, no los duplica | Quitar una imagen del portfolio no la borra de la biblioteca. La misma foto puede estar en varias secciones. |

## Fase 4 · Web pública ✅

**Entregado**

- Todas las secciones públicas leyendo de Firestore, con estados vacíos dignos.
- Textos editables por catálogo desde el panel.
- SEO por ruta: título, descripción, canonical, Open Graph y Twitter Card.
- Datos estructurados: `LocalBusiness` en portada y contacto, `Event` por cada
  sesión de taller, `FAQPage` en preguntas frecuentes.
- Páginas legales, `robots.txt` y `sitemap.xml`.

**Decisiones tomadas**

| Decisión | Motivo |
|---|---|
| En servidor las consultas se cierran tras la primera emisión | Los listeners de Firestore no terminan nunca. Sin esto el render de SSR se queda esperando a que la aplicación se estabilice y la petición acaba colgada. |
| El filtro de «activo» se hace en memoria, no en la consulta | Cada combinación de `where` + `orderBy` exige un índice compuesto en Firestore. Son colecciones pequeñas: filtrar en cliente ahorra ese mantenimiento. |
| Catálogo de textos en código en vez de constructor de bloques | El panel queda como una lista de campos con nombre en español, no como un editor de estructuras. Añadir un hueco cuesta una línea. |
| Si un texto está vacío se usa el del catálogo | La web nunca muestra un hueco en blanco, ni depende de que alguien haya entrado antes al panel. |
| Las páginas legales van con `noindex` | No aportan nada en buscadores y compiten por el presupuesto de rastreo. |
| Los talleres de «eventos privados» se listan aparte, sin fechas | No tienen sesiones: son a medida. Se resuelven por presupuesto (P4 en `pendientes.md`). |
| Sitemap estático | Todas las rutas públicas son fijas. Generarlo en el build solo haría falta si hubiera páginas por slug. |

## Fase 5 · Reservas ✅

**Entregado**

- Preguntas configurables por formulario y formulario público reutilizable.
- Reserva de plaza, solicitud de bono y los cuatro formularios de presupuesto.
- Vacaciones con contador anual y bloqueo de fechas.
- Plantillas de email editables y las cinco Cloud Functions del flujo.

**Decisiones tomadas**

| Decisión | Motivo |
|---|---|
| Cada respuesta se guarda con su etiqueta (`{id}` y `{id}__etiqueta`) | Si mañana se borra o se reescribe una pregunta, las respuestas ya recibidas siguen siendo comprensibles en la bandeja y en el correo. Cuesta el doble de claves, por eso el límite de las reglas subió a 60. |
| Honeypot fuera de pantalla, no con `display:none` | Muchos bots ignoran lo que está oculto con `display:none`. Al detectarlo se finge que el envío ha ido bien, para no darle pistas. |
| `confirmBooking` en transacción | Es la única operación con carrera real: dos administradoras confirmando a la vez la última plaza sobrevenderían la sesión. |
| Las plazas solo se devuelven si estaban descontadas | Cancelar una reserva que nunca llegó a confirmarse no debe sumar plazas de la nada. |
| Espejo público de cierres en `settings/cierres` | `vacations` lleva quién ha cogido cada periodo y notas internas, así que no puede ser de lectura pública. Una Function mantiene una copia con solo fechas y talleres afectados. |
| Sustitución de plantillas escrita a mano, sin Handlebars | Solo hacen falta `{{clave}}`, `{{{sinEscapar}}}` y `{{#if}}`. Añadir una dependencia para eso no compensa, y el escapado de HTML queda bajo control. |
| Las plantillas se buscan primero en Firestore y si no, en código | Son editables desde el panel, pero borrar una por error no deja a nadie sin acuse de recibo. |
| `/reservar` y `/solicitar` se renderizan solo en cliente | Son formularios: no aportan nada en buscadores y el SSR solo añadiría latencia. |

## Fase 6 · Bandejas ✅

**Entregado**

- Bandeja de reservas: filtros por estado y tipo, búsqueda, carga progresiva,
  confirmar y cancelar con movimiento real de plazas, notas internas y borrado.
- Bandeja de solicitudes con los cuatro estados y respuesta directa por correo.
- Calendario con vistas de mes, semana y lista, ocupación por colores y
  vacaciones de fondo.
- Inicio con métricas reales enlazadas a la sección correspondiente.

**Decisiones tomadas**

| Decisión | Motivo |
|---|---|
| Carga progresiva con `limit` en la consulta, no paginación por páginas | Firestore pagina por cursor, no por número de página: para saltar a la página 7 hay que haber leído las seis anteriores. Un botón de «cargar más» es honesto con cómo funciona la base de datos y más cómodo para revisar una bandeja. |
| Los filtros se aplican sobre lo ya cargado | Filtrar en servidor obligaría a un índice compuesto por cada combinación. Con el volumen real de Veta no compensa. |
| Abrir una solicitud «nueva» la pasa a «en curso» | Si la has leído ya no es nueva. Evita que el contador de la portada mienta. |
| No se puede borrar una reserva confirmada | Tiene plazas descontadas: borrarla las dejaría ocupadas para siempre. Hay que cancelarla primero, que sí las devuelve. |
| La ocupación se calcula solo sobre sesiones futuras | Mezclar las pasadas daría un porcentaje que no sirve para decidir nada. |
| Núcleo vanilla de FullCalendar en vez de `@fullcalendar/angular` | El adaptador declara un rango de versiones de Angular como peer dependency, y ya nos costó un conflicto fijar Angular a 20.0.x. El envoltorio propio son sesenta líneas y usa el mismo patrón de carga diferida que Jodit. |

## Fase 7 · Pulido ✅

**Entregado**

- `DialogoService`: Escape, foco devuelto y scroll bloqueado en los tres diálogos.
- `aria-current` en la navegación y menú móvil fuera del orden de tabulación.
- Dimensiones en las imágenes, presupuestos de bundle y cabeceras de caché.
- Cabeceras de seguridad y App Check listo para activar.
- Repaso responsive del panel, con objetivos táctiles de 44 px.
- `DESPLIEGUE.md` con la lista de comprobaciones previas.

**Decisiones tomadas**

| Decisión | Motivo |
|---|---|
| `NgOptimizedImage` descartado | Exige `width` y `height` obligatorios y lanza error en ejecución si faltan. Las imágenes ya subidas no los tienen, así que habría roto la web con datos reales. La ganancia de verdad está en la extensión *Resize Images*. |
| App Check se registra solo si hay clave configurada | Activarlo sin la clave de reCAPTCHA bloquea todas las escrituras a Firestore. Así el código está listo y se enciende pegando un valor. |
| El HTML se sirve con `no-cache` | Se genera en servidor con datos de Firestore. Cachearlo dejaría contenido viejo tras editar desde el panel. Los assets con hash sí van con caché de un año. |
| Objetivos táctiles de 44 px solo con `pointer: coarse` | Agrandar los controles en escritorio empeora la densidad del panel sin ganar nada. |
| El menú móvil usa `inert` en vez de desmontarse | Mantiene la animación de entrada y salida, y a la vez lo saca del orden de tabulación y de los lectores de pantalla cuando está cerrado. |

---

## Qué queda fuera de las siete fases

Nada de esto bloquea el uso diario, pero conviene tenerlo presente:

- **Alta manual de reservas** desde el panel (`pendientes.md` P16).
- **Lista de espera** cuando una sesión se llena (P2).
- **Recordatorio automático** antes del taller (P5).
- **Contadores agregados** para las estadísticas (D4, D27).
- **Tests de las reglas de Firestore** con el emulador (D6).
- **Auditoría de Lighthouse** sobre la build de producción.

---

## Optimizaciones propuestas

1. **Extensión Resize Images** de Firebase para generar miniaturas al subir. Evita
   servir originales de varios MB. Barata y sin código.
2. **Contadores agregados** mantenidos por Function para las estadísticas del
   panel, en lugar de contar documentos en cliente en cada visita.
3. **App Check** antes de publicar. Es la única defensa real contra un bot que
   escriba directamente en `bookings` saltándose el formulario.
4. **Tests de reglas de Firestore** con el emulador. Son baratos y evitan
   agujeros de seguridad silenciosos.
5. **Zoneless change detection**: el proyecto ya usa solo signals y `OnPush`, así
   que quitar `zone.js` es viable y reduce el bundle. Conviene hacerlo cuando el
   panel esté estable.


---

## Repaso posterior a las siete fases

Revisión del código entregado buscando incoherencias entre capas, no
funcionalidad nueva. Lo que apareció:

| Hallazgo | Gravedad | Estado |
|---|---|---|
| Las reglas dejaban cambiar `status` de una reserva y `plazasConfirmadas` de una sesión desde el cliente, saltándose la transacción de `confirmBooking` | Alta | Corregido y con tests |
| Borrar una reserva confirmada dejaba sus plazas ocupadas para siempre; solo lo impedía la interfaz | Alta | Ahora lo rechazan también las reglas |
| El editor de plantillas de email salía vacío al entrar en la sección | Media | Corregido |
| El aviso de cambios sin guardar en «Textos de la web» estaba invertido | Media | Corregido |
| Entrar directo a la reserva de una sesión completa mostraba el formulario | Baja | Corregido |
| `settings/cierres` depende de que las Functions estén desplegadas | Baja | Documentado (D31) |

Lo demás que salió en la revisión automática eran falsos positivos: propiedades
en notación abreviada que el análisis no reconocía, y rutas con parámetro.

---

## Tercera tanda de cambios con las clientas · 24/09/2026

Reunión con Carmen, ya con contenido real metido. Nueve cambios, ninguno de
estructura. La consigna que los ordena a todos la puso Gabriel al final: *«la web
ya se está convirtiendo en una bola para sus condiciones de usuario base»*. Está
recogida en `CLAUDE.md` §7 como regla permanente.

| Cambio | Cómo se ha resuelto |
|---|---|
| Láminas → PaiPai | Renombrado en los 16 sitios donde aparecía, más `npm run migrar:renombrados` para lo que Carmen ya había metido |
| Vídeos de Instagram en live art | Tres huecos por página, con carga bajo clic para no meter cookies de Meta sin permiso |
| Fuera la URL al crear un taller | Se escribe sola desde el título, con sufijo si choca |
| La rueda de minutos | Botones de duración (1 h, 1 h 30…) y un «otra» para lo raro |
| Taller privado | Formulario propio de presupuesto, no una reserva: no hay fecha ni plazas que descontar |
| «No hay fechas programadas» sin explicación | Cada sesión dice ahora por qué no se ve, si es que no se ve |
| Bonos | Fuera «Eventos privados», entra «Mixto»; el precio es por bono |
| La página de bonos no era editable | Ya lo es, como el resto |
| Alta manual de reservas | Un solo formulario: desplegable con fechas y bonos juntos, y nace confirmada |

El segundo formulario de talleres puntuales queda sin hacer porque no está
definido (`pendientes.md` D51).
