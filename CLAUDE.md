# VETA · Estudio Creativo — Web app

Portfolio + gestión de reservas de talleres para Veta, estudio creativo en Sevilla
(Carmen y Maripepi).

> Este fichero es la única fuente de verdad del proyecto. Si algo aquí contradice
> al código, gana este fichero y hay que corregir el código (o actualizar esto de
> forma consciente). No pegar encima contenido de otros proyectos.

---

## 1. Stack

| Capa | Decisión |
|---|---|
| Framework | Angular 20 — standalone components, signals, control flow `@if` / `@for`. **No NgModules.** |
| Versionado | Angular fijado a `~20.0.0`. Ver `pendientes.md` D14 antes de subir de versión. |
| Estilos | SCSS + tokens en CSS custom properties. CSS3 nativo, flexbox y grid. |
| Iconos | Font Awesome (subset SVG, no la hoja completa) |
| Modales / feedback | SweetAlert2, tematizado con los tokens de Veta |
| Componentes utilitarios | Angular Material **solo en el panel** (spinner, datepicker, menú). No en la parte pública. |
| Editor de texto | Jodit 4.7.6, servido desde el propio proyecto. Solo en el panel. |
| Calendario del panel | FullCalendar, núcleo vanilla con envoltorio propio — ver nota en §9 |
| Backend | Firebase directo desde el cliente (`@angular/fire`). **Sin backend propio.** |
| Datos | Cloud Firestore |
| Archivos | Cloud Storage |
| Auth | Firebase Auth (email/password) |
| Emails | Function propia con Nodemailer sobre la cola `mail/`. Plantillas editables en `templates/`. **La extensión *Trigger Email* se descartó** — ver §4. |
| Functions | 2nd gen, **solo** para lo que no puede ir en cliente de forma segura (§4) |
| Hosting | Firebase Hosting |
| Rendering | SSR en la parte pública. El panel es SPA pura, no se prerenderiza. |

**Plan Firebase: Blaze**, alerta de presupuesto a 10 €/mes. Obligatorio: Storage y
Cloud Functions no funcionan en Spark. El volumen real cae dentro del free tier.

Proyecto Firebase: `veta-estudio-creativo`. La configuración vive en
`src/environments/`.

### Estructura de carpetas

```
src/app/
  core/
    data/          servicios de acceso a Firestore (los componentes nunca llaman a Firestore)
    auth/          guard, servicio de sesión
    models/        interfaces TypeScript de las colecciones
  features/
    public/        una carpeta por sección pública
    admin/         una carpeta por sección del panel
  layout/          layout público y layout del panel
  shared/          componentes reutilizables
src/styles/
  tokens.scss      solo Sass: breakpoints y mixins. Sin salida CSS.
  base.scss        custom properties, reset, tipografía base, utilidades
  public/          estilos del tema visual público
  admin/           estilos del panel
functions/src/index.ts
firestore.rules
storage.rules
firebase.json
```

Los estilos del tema público y los del panel **no se mezclan**. Cada componente
tiene su `.scss`, pero lo compartido vive en `src/styles/`. `tokens.scss` no emite
CSS, por eso se puede importar desde cualquier componente con `@use 'tokens' as *;`
sin duplicar las custom properties.

---

## 2. Alcance funcional

### Público (sin login)
- Home
- Quiénes somos
- Papelería de bodas (6 subsecciones)
- Live art
- Acuarelas y encargos
- Talleres (puntuales + bonos) con calendario de plazas
- Preguntas frecuentes
- Contacto
- Formularios de presupuesto y de reserva

### Panel (`/panel`, requiere login)
- Inicio con resumen y estadísticas
- Calendario de sesiones de taller
- Reservas: listado paginado con filtros, alta, edición, borrado
- Solicitudes de presupuesto: bandeja con estados
- Talleres, sesiones, plazas y precios
- Bonos mensuales
- Productos de papelería
- Portfolio: subida y ordenación de imágenes
- Biblioteca de medios (imágenes y PDF) con categorías, filtros y vista galería
- Preguntas frecuentes
- Frases públicas / testimonios
- Preguntas extra de cada formulario
- Plantillas de email
- Vacaciones
- Administradoras
- Configuración: redes sociales, datos de contacto, activar/desactivar secciones

El menú del panel se organiza por **cómo se recorre la web**, no por cómo se
guardan los datos: «La web» lleva una entrada por página en el orden del menú
público, y «Catálogo» lo que se reutiliza entre páginas.

### Fuera de alcance
- **Sin pasarela de pago.** El cobro es presencial o por Bizum externo. El flujo
  digital termina en «solicitud recibida» + email; la confirmación la hace la
  admin a mano desde el panel.
- Sin cuentas de usuario para clientes.
- Sin carrito ni e-commerce.
- **Sin citas individuales.** El único evento reservable es una sesión de taller
  con N plazas.
- Sin blog en esta versión. La configuración deja el flag preparado.

---

## 3. Estructura del menú público

```
Inicio
Quiénes somos
  · Qué es Veta. Estudio creativo
  · Quiénes son Carmen y Maripepi
Papelería de bodas
  · Invitaciones          → formatos, sobres, sellos, complementos · precios desde X/ud
  · Seating plan y meseros → colección disponible + diseño a medida
  · Minutas
  · Marcasitios
  · Láminas personalizadas
  · Pack completo — OFERTA (descuento por papelería completa)
Live art — Acuarelas en directo
Acuarelas y encargos
Talleres
  · Talleres puntuales → Cerámica · Pintura · Infantil · Eventos privados
  · Bonos mensuales    → Bono cerámica · Bono pintura · Bono infantil
Preguntas frecuentes
Contacto
```

Todas las secciones de papelería siguen el mismo patrón: galería de ejemplos +
precios orientativos + CTA al formulario de presupuesto.

### Estructura de la home

Referencia de ritmo visual: trantan.es. Copiamos la **secuencia de bloques**, no
el contenido ni nada de tienda online.

1. Hero a sangre con imagen protagonista y claim corto
2. Frase de marca a gran tamaño (serif, mucho aire) + CTA al portfolio
3. Bloque destacado: dos o tres piezas con imagen grande
4. Papelería de bodas: rejilla de las 6 subsecciones con precio orientativo,
   enlazando al formulario de presupuesto (nunca a un carrito)
5. Live art: bloque a pantalla partida, texto + galería, CTA a la sección
6. Talleres: próximas sesiones con plazas disponibles
7. Testimonios (colección `quotes`)
8. Cierre: Instagram, Pinterest, contacto

Todos los bloques leen su contenido de `pages/home` y son ocultables desde el panel.

---

## 4. Flujos

**Presupuesto (papelería, live art, encargos)**
1. Cliente rellena el cuestionario de la sección.
2. Se crea `requests` con `status: "nueva"`.
3. La Function `onRequestCreated` escribe en `mail/` → email a Veta + acuse al cliente.
4. Veta responde con presupuesto concreto fuera de la app.

**Reserva de taller puntual**
1. Cliente elige una sesión con plazas libres del calendario.
2. Rellena el cuestionario → se crea `bookings` con `status: "pendiente"`.
3. Email a Veta y al cliente («solicitud recibida, te confirmamos en breve»).
4. La admin confirma desde el panel → `status: "confirmada"` → email con
   instrucciones de pago (Bizum o en el estudio).
5. **Las plazas solo se descuentan al confirmar**, nunca al solicitar.
6. Cada taller y cada fecha puede tener un número distinto de plazas, gestionado
   desde el panel.

**Bono mensual** — igual pero sin calendario: cuestionario + email.

### Qué va en Cloud Functions y por qué

Todo lo demás es cliente contra Firestore. Estas cinco cosas no pueden serlo:

| Function | Motivo |
|---|---|
| `confirmBooking` | Decrementar plazas debe ser una transacción servidor. Si no, dos admins confirmando a la vez sobrevenden la sesión. |
| `onRequestCreated` / `onBookingWrite` | Componer el documento de `mail/` con la plantilla correcta. Si el cliente escribiera en `mail/`, cualquiera podría enviar correos desde el dominio de Veta. |
| `createAdminUser` | Crear usuarios y asignar custom claims requiere Admin SDK. |
| `resetVacationCounters` | Cron anual: pone a 0 los contadores el 1 de enero. |
| `enviarCorreo` | Consume la cola `mail/` y envía por SMTP. Las credenciales no pueden estar en el cliente. |

**La extensión *Trigger Email* se descartó.** Hacía exactamente lo que hace
`enviarCorreo`, pero el servicio de extensiones de Firebase se apaga el 31 de
marzo de 2027: a partir de esa fecha una extensión instalada no se puede
actualizar, **reconfigurar** ni desinstalar. Reconfigurarla era justo lo previsto
—cambiar de Gmail a un proveedor propio al tener dominio, o rotar la contraseña
de aplicación—, así que la dependencia nacía con fecha de caducidad. La Function
propia son unas cien líneas, y como el resto del código solo escribe en `mail/`,
cambiar de proveedor no toca nada más. Detalle y configuración en `CORREOS.md`.

---

## 5. Modelo de datos (Firestore)

```
admins/{uid}
  nombre, email, rol: 'admin', activo, diasVacaciones, createdAt

workshops/{id}
  slug, categoria: 'ceramica'|'pintura'|'infantil'|'eventos'
  titulo, descripcion (HTML), precio, duracionMin, imagenes[], activo, orden

sessions/{id}                     // fechas concretas de un taller
  workshopId, fechaInicio (Timestamp), fechaFin (Timestamp)
  plazasTotales, plazasConfirmadas, activa, notasInternas

bonos/{id}
  categoria, titulo, descripcion (HTML), precioMes, sesionesMes, activo, orden

products/{id}                     // papelería de bodas
  categoria: 'invitaciones'|'seating'|'minutas'|'marcasitios'|'laminas'|'pack'
  titulo, descripcion (HTML), precioDesde, unidad, imagenes[], destacado, orden, activo

portfolio/{id}
  seccion, titulo, imagen, alt, orden, activo

bookings/{id}
  sessionId | bonoId, tipo: 'taller'|'bono'
  nombre, email, telefono, nPersonas, respuestas: {}
  status: 'pendiente'|'confirmada'|'cancelada'
  createdAt, confirmadaAt, notasInternas

requests/{id}                     // presupuestos
  tipo: 'papeleria'|'liveart'|'encargo'|'contacto'
  nombre, email, telefono, respuestas: {}
  status: 'nueva'|'en-curso'|'respondida'|'cerrada'
  createdAt, notasInternas

formQuestions/{id}                // preguntas extra por formulario (§6)
  formulario: 'papeleria'|'liveart'|'encargo'|'taller'|'bono'|'contacto'
  etiqueta, tipo: 'texto'|'textarea'|'opciones', opciones[]
  obligatoria, orden, activa

vacations/{id}
  adminUid, fechaInicio, fechaFin, workshopIds[], nota, createdAt

faqs/{id}
  pregunta, respuesta (HTML), categoria, orden, activa

quotes/{id}                       // frases públicas y testimonios
  texto, autor, contexto, orden, activa

media/{id}
  nombre, url, storagePath, tipo: 'imagen'|'pdf'
  categoriaId, alt, bytes, width, height, createdAt

mediaCategories/{id}
  nombre, slug, orden

pages/{slug}                      // home, quienes-somos, live-art, ..., legal
  textos: { clave: valor }        // los huecos de cada página, definidos en
  imagenes: { clave: Imagen }     // core/data/textos.ts (§6b)
  seo: { title, description, ogImage }

settings/site                     // documento único
  secciones: { faq, talleres, bonos, liveart, blog, reservas }   // flags on/off
  redes: { instagram, pinterest, facebook, tiktok }
  contacto: { email, telefono, direccion, horario }
  avisoGlobal: { activo, texto }

templates/{id}                    // plantillas de correo, editables desde el panel
  subject, html, descripcion

mail/{id}                         // cola de correo. Escritura solo Functions.
  to[], replyTo, message: { subject, html }, createdAt
  delivery: { state, error, messageId }   // lo escribe enviarCorreo
```

### Reglas de seguridad

- Lectura pública: `workshops`, `sessions`, `bonos`, `products`, `portfolio`,
  `pages`, `faqs`, `quotes`, `settings`, `formQuestions`, `media`.
- Escritura en todo lo anterior: solo UID con custom claim `admin`.
- `bookings` y `requests`: `create` público **con validación de esquema en las
  reglas** (campos obligatorios, tipos, longitudes máximas, `status` forzado al
  valor inicial). Lectura, update y delete solo admin.
- `mail/`: sin acceso desde cliente. Solo Functions.
- `admins/`: lectura para admins, escritura solo desde `createAdminUser`.

---

## 6. Formularios

Cada formulario tiene una parte fija en código y una parte editable desde el panel.

**Campos fijos** (siempre presentes, siempre validados): nombre, email, teléfono,
y en reservas de taller también número de personas.

**Preguntas extra**: Carmen añade desde el panel preguntas por formulario
(`formQuestions`), de tipo texto corto, texto largo u opciones. Se renderizan
debajo de los campos fijos y las respuestas se guardan en `respuestas: {}`
indexadas por el id de la pregunta.

Todos los formularios llevan checkbox de aceptación de política de privacidad y
honeypot antispam.

### 6b. Contenido editable de la web

`core/data/textos.ts` declara, para cada página, **sus bloques en el orden en que
se ven al bajar por ella**, y dentro de cada bloque sus campos: línea, párrafo,
texto con formato o imagen. El panel genera a partir de ahí un formulario que se
recorre igual que la página, y la web pública lee esos valores de
`pages/{slug}.textos` y `pages/{slug}.imagenes`.

Cada página declara además `relacionado`: enlaces a lo que sale en esa página
pero se gestiona en otro sitio por reutilizarse (productos, sesiones,
testimonios). Es lo que responde a «¿dónde se cambia esto?» sin tener que
preguntar.

Se descartó un constructor de bloques genérico: es mucho más flexible, pero
convierte el panel en un editor de estructuras. Las usuarias son dos diseñadoras
sin perfil técnico, y una lista de campos con nombre es más fácil de usar y de
explicar. Añadir un hueco nuevo cuesta una línea en ese fichero.

Si un texto está vacío, la web usa el valor por defecto del catálogo, así que
nunca aparece un hueco en blanco.

---

## 7. Panel de administración

- Login en `/acceso`. Email y contraseña obligatorios, opción «mantener sesión
  iniciada» (`browserLocalPersistence` frente a `browserSessionPersistence`).
  Firebase gestiona el hash de la contraseña; no almacenamos credenciales.
- **Todas las rutas del panel cuelgan de `/panel`** y pasan por `authGuard`.
  Toda acción contra Firestore desde el panel exige el custom claim `admin`.
- Layout con menú lateral izquierdo, grupos desplegables estilo WordPress. Las
  opciones de uso diario (Reservas, Calendario, Solicitudes, Talleres) tienen
  entrada propia de primer nivel; el resto se agrupa bajo «Contenido» y
  «Configuración».
- Botón permanente en la barra lateral para abrir la web pública.
- Inicio con métricas: reservas pendientes, próximas sesiones, plazas ocupadas,
  solicitudes sin responder. Datos reales desde la fase 6; antes, mock.
- Todos los campos de texto largo usan el editor Jodit.
- Empty state agradable en cualquier sección sin datos.
- Confirmación visible en cada acción, con SweetAlert2.

### Vacaciones

- Cada administradora registra periodos con fecha de inicio y fin (`<input type="date">`).
- Cada periodo se asocia a los talleres o servicios que no se realizarán.
- Los días de esos periodos quedan bloqueados en el calendario público y en
  cualquier punto del panel donde se cree o edite una sesión.
- Contador de días consumidos por administradora, visible para todas. Se pone a
  0 el 1 de enero de cada año natural.
- Al crear una sesión que solape con un periodo de vacaciones, se avisa y se
  bloquea el guardado.

### Diseño del panel

Las capturas de `dashboard-design/` son de otro proyecto (un CMS para
psicólogas). **Sirven como referencia de layout, densidad y jerarquía visual,
nunca de contenido**: ignora sus textos, su nombre de producto y sus secciones
(pacientes, blog). Adapta la estética a los colores y la tipografía de Veta.

Usuarias objetivo: dos diseñadoras, no perfiles técnicos. Prioriza claridad
sobre densidad: pocas opciones por pantalla, etiquetas en español natural,
confirmación visible en cada acción.

---

## 8. Identidad visual

Assets en la raíz: `lodo-veta-*.png`, `CARTA DE COLOR.png`, `fonts/`.

```scss
--veta-terracota:  #B0592B;  // color principal, CTAs
--veta-oliva:      #5A6248;  // fondos oscuros, footer
--veta-crema:      #F2EBE1;  // fondo base
--veta-arena:      #E3D5C4;  // superficies secundarias
--veta-tinta:      #2E2A26;  // texto
```
*(Afinar con el archivo original de la carta de color.)*

**Tipografía**: Laima (en `fonts/`, convertida a webfont en `src/assets/fonts/`)
para titulares — es la serif de contraste alto del logo. Para cuerpo, Karla.
El script del logo solo en elementos de marca, nunca en texto corrido.

**Tono**: artesanal, cálido, mucho aire. La fotografía manda, la interfaz se
aparta. Es una empresa de diseño: el acabado visual y el responsive son críticos.
Referencias: trantan.es y labahiacreativa.com.

---

## 9. Convenciones de código

- Componentes standalone, una carpeta por feature, `ChangeDetectionStrategy.OnPush`.
- Estado con signals. RxJS solo en streams de Firestore.
- `toSignal` con `initialValue: {}` ensancha el tipo a `T | {}`, y sobre `{}` no
  se puede indexar por clave. Cuando el valor sea un mapa, hay que tipar el
  inicial: `initialValue: {} as Record<string, Imagen>`. Con arrays no pasa,
  porque `never[]` sigue admitiendo `.filter` y `.length`.
- **Un `computed()` no puede leer estado de formularios reactivos** (`.value`,
  `.invalid`, `.touched`): no son señales, así que el `computed` se evalúa una
  vez y ya no se entera de nada más. Si hace falta reaccionar a un formulario,
  se pasa por `toSignal(control.valueChanges)` o `toSignal(grupo.statusChanges)`.
- Servicios de datos aislados en `core/data/`. Los componentes nunca llaman a
  Firestore directamente.
- Rutas con lazy loading (`loadComponent` / `loadChildren`) y protección de rutas.
- `let` y `const`, nunca `var`.
- HTML semántico. Nada de `alert`, `confirm` ni `prompt`: todo el feedback en el
  DOM con SweetAlert2 tematizado.
- `preventDefault()` en todos los submit y en los click que no navegan.
- Validación de solapamientos siempre que haya fechas.
- Medidas en `rem`, con `html { font-size: 62.5%; }` — da un rem = 10px sin
  romper el zoom del navegador ni la preferencia de tamaño del usuario.
- Accesibilidad: `alt` en todas las imágenes, foco visible, contraste AA.
- Imágenes con `width`/`height` explícitos cuando se conocen, `loading="lazy"`
  y `sizes`. Los valores tienen que ser los **reales** del archivo: si mienten,
  el navegador reserva un hueco con la proporción equivocada. Nada de reglas
  globales tipo `img[width][height] { height: auto }`: un selector de atributo
  pesa lo mismo que una clase y pisa las alturas fijas de los logos. **`NgOptimizedImage` se descartó**: exige dimensiones obligatorias
  y lanza un error en tiempo de ejecución si faltan, y las imágenes que ya
  estuvieran subidas no las tienen. La ganancia real vendrá de la extensión
  *Resize Images* (`pendientes.md` D3), no de la directiva.
- Textos de interfaz en español. Nombres de código en inglés salvo los términos
  de dominio ya fijados (`bonos`, `meseros`, `minutas`).
- SEO en la parte pública: títulos y meta por ruta, datos estructurados
  `LocalBusiness` y `Event` en las sesiones de taller, sitemap y canonical.
- Reutilizar componentes antes que duplicarlos.
- Código legible por encima de código corto. Comentarios mínimos.
- No romper funcionalidad ya entregada.

### Manejo de HTML y `innerHTML`

Regla general: **no construir DOM a mano ni inyectar HTML**. En Angular el
template ya lo resuelve, así que `createElement` / `appendChild` no hacen falta.

Excepción necesaria: los campos de Jodit producen HTML que hay que pintar. Se
renderiza con `[innerHTML]` pasando **siempre** por `DomSanitizer`, y solo para
contenido que ha escrito una administradora autenticada. Nunca para nada que
venga de un formulario público.

### Notas de SSR

Jodit, SweetAlert2 y FullCalendar tocan `window`. Se cargan con `import()`
dinámico dentro de un guard `isPlatformBrowser`, y solo en el chunk del panel.
El panel queda excluido del prerender. Sin esto la build de SSR rompe.

**En servidor no se usan listeners de Firestore.** `ColeccionBase.listar()` y
`leerDocumento()` devuelven un listener en navegador y una lectura suelta
(`getDocs` / `getDoc`) en servidor. Un listener abre un canal permanente, y
Angular no da por terminado el renderizado hasta que la aplicación se queda
quieta: con un listener abierto eso no pasa nunca y la petición se cuelga hasta
que algo expira. Cualquier servicio nuevo que lea de Firestore para la parte
pública tiene que pasar por ahí.

### Sobre el calendario

`calendarjs.com` no tiene integración con Angular y obligaría a manipular el DOM
a mano. Usamos **FullCalendar**, con vistas de mes, semana y lista, y traducción
al español.

Se usa el **núcleo vanilla** (`@fullcalendar/core` y sus plugins) dentro de un
envoltorio propio, no el paquete `@fullcalendar/angular`. Motivo: ese adaptador
declara un rango de versiones de Angular como peer dependency y nos habría dejado
expuestos al mismo tipo de conflicto que ya obligó a fijar Angular a 20.0.x
(`pendientes.md` D14). El envoltorio son unas sesenta líneas y sigue el mismo
patrón de carga diferida que Jodit y SweetAlert2, así que no añade complejidad
nueva.

FullCalendar 6 inyecta sus propios estilos: no hay que importar ningún CSS.

### Orden de las rutas

La ruta comodín (`**`, página 404) vive **dentro** del layout público para
conservar cabecera y pie. Como un comodín siempre encaja, `/acceso` y `/panel`
deben declararse **antes** en el array de rutas o nunca se alcanzarían.

---

## 10. Fases de desarrollo

Al terminar cada fase **paro** para que puedas probar antes de seguir.

1. ✅ Andamiaje: proyecto Angular, Firebase, tokens de estilo, layout público y de panel, reglas de seguridad.
2. Auth y panel: login, guard, layout, CRUD de administradoras, configuración del sitio.
3. Contenido: talleres, bonos, productos, portfolio, biblioteca de medios, FAQ, frases.
4. Público: home y todas las secciones, leyendo de Firestore, con SEO.
5. Reservas: calendario público, sesiones, formularios, vacaciones, emails.
6. Bandejas: reservas y solicitudes en el panel, confirmación, estadísticas reales.
7. Pulido: responsive, accesibilidad, rendimiento, despliegue.

Detalle en `plan-implementacion.md`. Estado tarea a tarea en `tareas.md`.

---

## 11. Estado actual

Fase 1 entregada. **Todo el contenido es placeholder** hasta que Carmen y
Maripepi entreguen fotos, textos y precios reales.

---

## 12. Modo de trabajo

- Solo código, comentarios mínimos: el código debe explicarse solo.
- No expliques en el chat lo que hace el código.
- Respuestas en español.
- Ante una ambigüedad, revisa este fichero; si sigue sin estar claro, pregunta.
- Mantén `plan-implementacion.md` y `tareas.md` actualizados al completar tareas,
  y anota en `pendientes.md` toda duda abierta o deuda técnica que asumas.
