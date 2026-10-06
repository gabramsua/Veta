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
| Editor de texto | Jodit 4.7.6, servido desde el propio proyecto. Solo en el panel. Con botón propio para insertar imágenes de la biblioteca. |
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
Live art
  · Acuarelas en directo
  · Live art previo
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

**Presupuesto (papelería, live art, encargos, talleres privados)**
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

**Taller privado** (despedidas, cumpleaños, regalos) — no es una reserva aunque
salga desde Talleres: no hay fecha en el calendario ni plazas que descontar,
porque la sesión se monta a medida. Va por el flujo de presupuesto, con
`requests.tipo: "evento"`.

**Alta manual de una reserva** — para quien llama por teléfono o se apunta en el
estudio. La Function `crearReservaManual` crea la reserva **ya confirmada** y
descuenta las plazas en la misma transacción: quien apunta ya lo ha hablado con
la clienta, y obligar a un segundo clic de confirmación sería repetir el flujo de
la web para un caso que no lo necesita. Marca `origen: "panel"`, y por eso
`onBookingCreated` se calla: mandar un «hemos recibido tu solicitud» a quien
nunca solicitó nada sería mentira. El correo de confirmación es opcional —a veces
no hay ni dirección de correo— y lo encola la propia Function.

### Qué va en Cloud Functions y por qué

Todo lo demás es cliente contra Firestore. Estas cosas no pueden serlo:

| Function | Motivo |
|---|---|
| `confirmBooking` | Decrementar plazas debe ser una transacción servidor. Si no, dos admins confirmando a la vez sobrevenden la sesión. |
| `crearReservaManual` | Lo mismo, en el alta a mano: nace confirmada y descuenta plazas en el mismo paso. Las reglas de Firestore prohíben —a propósito— que el cliente toque `plazasConfirmadas`. |
| `onRequestCreated` / `onBookingWrite` | Componer el documento de `mail/` con la plantilla correcta. Si el cliente escribiera en `mail/`, cualquiera podría enviar correos desde el dominio de Veta. |
| `createAdminUser` | Crear usuarios y asignar custom claims requiere Admin SDK. |
| `resetPasswordAdmin` | Generar un enlace de cambio de contraseña requiere Admin SDK. Auth solo guarda un hash, así que no existe forma de leer la contraseña: solo de sustituirla. |
| `enviarCorreo` | Consume la cola `mail/` y envía por SMTP. Las credenciales no pueden estar en el cliente. |
| `getPlantillasPorDefecto` | Devuelve al panel las plantillas de serie. Viven en el código de Functions y el editor necesita enseñarlas; copiarlas al cliente las separaría al primer cambio. |

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
  nombre, email, rol: 'admin', activo, createdAt
  // La contraseña NO está aquí: vive en Firebase Auth, como hash scrypt.
  // Los días de vacaciones tampoco: se calculan desde `vacations`.

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
  origen?: 'panel'   // solo las que se apuntan a mano; ausente = vino de la web

requests/{id}                     // presupuestos
  tipo: 'papeleria'|'liveart'|'encargo'|'evento'|'contacto'
  nombre, email, telefono, respuestas: {}
  status: 'nueva'|'en-curso'|'respondida'|'cerrada'
  createdAt, notasInternas

formQuestions/{id}                // preguntas extra por formulario (§6)
  formulario: 'papeleria'|'liveart'|'encargo'|'evento'|'taller'|'bono'|'contacto'
  etiqueta, tipo: 'texto'|'textarea'|'opciones'|'fecha', opciones[]
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

pages/{slug}                      // home, quienes-somos, papeleria-invitaciones,
  textos: { clave: valor }        // live-art, ..., legal. Los huecos de cada
  imagenes: { clave: Imagen }     // página, definidos en core/data/textos.ts (§6b)
  estilos: { clave: 'titular'|'cuerpo'|'eslogan' }   // familia elegida por frase
  seo: { title, description, ogImage }
  // Cada Imagen lleva además `posicion: 'completa'|'izquierda'|'derecha'`,
  // que decide si el texto la rodea.

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
(`formQuestions`), de tipo texto corto, texto largo, opciones o fecha. Se
renderizan debajo de los campos fijos y las respuestas se guardan en
`respuestas: {}` indexadas por el id de la pregunta.

Las de tipo fecha usan `<input type="date">` con `min` en el día de hoy, y no
admiten fechas pasadas: el `min` desanima en el calendario, y al enviar se
comprueba otra vez porque el campo se puede escribir a mano. Se guardan como
`2027-06-12`. Al
mostrarlas se pasan por `formatearFechaIso`, que parte la cadena a mano en vez de
construir un `Date`: `new Date('2027-06-12')` es medianoche UTC y al formatearla
en otro huso puede enseñar el día anterior. Esa función está duplicada en
`core/data/fechas.ts` y en `functions/src/emails.ts` porque cliente y Functions
se compilan por separado; si se toca una, hay que tocar la otra.

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

**Un bloque sin texto no se pinta.** La sección entera desaparece: nada de
títulos huérfanos ni de avisos del tipo «texto pendiente de escribir», que son
para el desarrollador y no para una clienta.

**Para saber si un campo de Jodit está vacío hay que usar `tieneContenido()`,
nunca la cadena a secas.** Jodit no devuelve `''` al borrar el contenido: deja
el párrafo donde estaba el cursor, normalmente `<p><br></p>` o `<p>&nbsp;</p>`.
Eso tiene longitud, así que un `@if (texto)` lo da por bueno y pinta la sección
con todo su espaciado y un párrafo vacío dentro — el hueco enorme que aparecía
entre la cabecera y el contenido siguiente. `tieneContenido()` está en
`core/seo/quitar-html.ts`, quita las etiquetas y cuenta lo que queda, pero da
por bueno lo que trae imagen, tabla, vídeo o `hr`. `BloqueTexto` y
`BloqueIlustrado` ya lo aplican solos; los `@if` que envuelven una `<section>`
tienen que llamarlo a mano, porque lo que deja el hueco es el padding de la
sección, no el componente de dentro.

Lo que decide es **el texto, no la imagen**. Son secciones de texto con una foto
que las acompaña, así que una imagen suelta bajo un título no es una sección:
son restos de cuando el bloque sí se usaba. Si la condición fuera «texto o
imagen», vaciar el texto no bastaría para retirar un bloque y habría que
acordarse de quitar también la foto. `BloqueIlustrado` cubre además el caso de
que no llegue nada.

**Colocación de la imagen.** Los campos marcados con `permitePosicion` sacan en
el panel un desplegable con ancho completo, izquierda o derecha. En los dos
últimos el texto rodea la imagen con `float`, no con rejilla: una rejilla deja
el texto cortado a la altura de la foto, y lo que se busca es que las líneas
sigan por debajo. En móvil todas vuelven a ancho completo. El valor se guarda
dentro de la propia `Imagen`, no en un mapa aparte como `estilos`, para que se
borre sola al quitar la imagen.

Solo se marcan los campos cuya plantilla lo aplica —los que van junto a un texto
con formato—, y todos pasan por `BloqueIlustrado`. Una portada a sangre no lo
admite y no se marca.

**Las seis subsecciones de papelería** (`papeleria-invitaciones`, `-seating`…)
se generan con una función en `textos.ts` porque son idénticas salvo el nombre.
Cada una trae entradilla propia, dos bloques explicativos opcionales y un campo
`modoCatalogo` que decide si los modelos se ven en rejilla de fichas o en
bloques grandes alternados. La rejilla es lo que pidieron para invitaciones y
marcasitios; los bloques es como se veía todo antes.

Ese `modoCatalogo` usa el tipo de campo `opcion`, un desplegable de valores
cerrados que se guarda en `textos` como una cadena más. No necesita colección ni
método de servicio propios.

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
- Contador de días consumidos por administradora, visible para todas, y también
  en la tabla de Administradoras. **Se calcula sumando los periodos de
  `vacations` del año en curso, no se guarda en ningún sitio.** Hubo un campo
  `admins.diasVacaciones` con un cron que lo ponía a 0 cada enero, pero nadie lo
  incrementaba nunca: la tabla enseñaba siempre 0 mientras la sección de
  Vacaciones daba el número bueno. Un valor derivado que además se almacena es
  un valor que puede mentir, y este mentía desde el primer día. Al calcularlo,
  el «se reinicia en enero» sale solo del filtro por año y el cron sobra.
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

**Cada función nueva tiene que caber sin engordar el panel.** Es la regla que
manda sobre las demás desde septiembre de 2026: la web ya es grande para lo que
necesitan dos personas. Antes de añadir una pantalla, mirar si la función cabe
en una que ya existe; antes de añadir un campo, si se puede deducir; antes de
partir una decisión en dos pasos, si de verdad son dos. El alta manual de
reservas es el ejemplo: un solo desplegable con las fechas y los bonos juntos en
vez de «¿taller o bono?» y luego otro selector, porque en la cabeza de quien
apunta eso es una sola decisión —«la del sábado»—, y nace confirmada en vez de
pendiente porque ya está hablado.

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

**Tipografía**: tres familias, todas OFL y **servidas desde el propio dominio**
vía paquetes de Fontsource, nunca desde el CDN de Google. Alojarlas nosotros es
lo que evita mandar la IP de cada visitante a un tercero y permite seguir sin
banner de cookies (`DATOS-LEGALES.md`).

| Uso | Familia | Token |
|---|---|---|
| Titulares | Bodoni Moda Variable, peso 400 | `--fuente-titular` |
| Cuerpo | Karla Variable | `--fuente-cuerpo` |
| Frases de marca | Pinyon Script | `--fuente-eslogan` |

**Laima se retiró.** Era la serif del logo, pero en titulares se veía demasiado
pesada. El logo es una imagen, así que la marca no se toca.

Bodoni Moda **no tiene pesos por debajo de 400**: bajar `font-weight` no hace
nada, el navegador lo recorta al mínimo. Lo que afina una Didone es el eje de
tamaño óptico (`opsz`, de 6 a 96), y por eso los titulares llevan
`font-optical-sizing: auto`. Por lo mismo se importa `standard.css` del paquete
y no `index.css`: ese último viene recortado al eje de peso y se deja fuera el
`opsz`.

**La familia de cada frase se elige desde el panel.** Un campo de `textos.ts`
con `estiloPorDefecto` saca en el editor un desplegable con las tres familias, y
lo elegido se guarda en `pages/{slug}.estilos`. En la web lo aplica la directiva
`vetaFuente`.

Solo se marcan los campos cuya plantilla pública sabe pintar el estilo: enseñar
el selector en un campo que luego lo ignora sería un control que miente. Añadir
uno nuevo son dos líneas —el `estiloPorDefecto` en el catálogo y el
`[vetaFuente]` en la plantilla— y hay que hacer las dos.

La inglesa solo funciona en frases cortas: en texto corrido es ilegible y en
cuerpos pequeños los trazos finos desaparecen. Por eso no se ofrece en los
campos de texto largo.

**Nada de Didot de pago ni de descargas «gratis para uso personal»**: la web
factura, así que cualquier fuente tiene que permitir uso comercial.

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
  `LocalBusiness`, `Event`, `FAQPage` y `BreadcrumbList`, sitemap y canonical.
  El negocio es local, así que los títulos y descripciones por defecto nombran
  la localidad, y la ficha `LocalBusiness` se alimenta entera de
  `settings/site.contacto` y `.redes` para que **el nombre, la dirección y el
  teléfono se puedan cuadrar letra por letra con el Perfil de Empresa de Google
  sin desplegar**. Ese cuadre —el NAP consistente— pesa más que cualquier
  palabra clave. Detalle y qué falta, en `SEO-LOCAL.md`.
- **Nada de terceros que pongan cookies.** Es la regla que sostiene que la web no
  lleve banner de consentimiento, y por la que las fuentes se autoalojan con
  Fontsource en vez de pedirlas al CDN de Google. Por eso la analítica es
  Cloudflare Web Analytics y no Google Analytics —ni Firebase Analytics, que es
  el mismo producto—, y por eso los vídeos de Instagram no cargan hasta que
  alguien los pulsa. Añadir un mapa de Google o un vídeo de YouTube incrustado
  rompería esto y obligaría a rehacer los textos legales (`DATOS-LEGALES.md`).
  Cuando haga falta cargar algo de un tercero, la salida es **consentimiento por
  elemento y recordado**, no un banner de sitio: el propio clic en el elemento
  es el consentimiento, `ConsentimientoInstagram` lo guarda y a partir de ahí
  ese tercero carga solo. Vale legalmente —es un acto afirmativo, informado y
  revocable— y no le enseña una ventana a todo el que entra, incluida la gente
  que nunca pisa esa página. En servidor el consentimiento siempre responde que
  no: no hay `localStorage`, y pintar el marco en el HTML del servidor cargaría
  al tercero antes de poder comprobar nada.
- Reutilizar componentes antes que duplicarlos.
- Código legible por encima de código corto. Comentarios mínimos.
- No romper funcionalidad ya entregada.

### Manejo de HTML y `innerHTML`

Regla general: **no construir DOM a mano ni inyectar HTML**. En Angular el
template ya lo resuelve, así que `createElement` / `appendChild` no hacen falta.

**Imágenes dentro del texto.** El editor lleva un botón que abre la biblioteca
de medios e inserta la imagen donde está el cursor, con tres anchos posibles
(`bt__imagen--completa|media|pequena`). El ancho lo decide la hoja de estilos de
`BloqueTexto`, no un `style` en línea, para que una imagen insertada hoy se
adapte sola si mañana cambia la maquetación. Se guarda el `width` y el `height`
reales del archivo para que no haya salto al cargar. Como todo el texto rico se
pinta con `BloqueTexto`, esto vale igual en páginas, talleres, bonos, productos
y FAQ. En las plantillas de correo va apagado (`permiteImagenes` a `false`):
muchos gestores bloquean las imágenes remotas.

Excepción necesaria: los campos de Jodit producen HTML que hay que pintar. Se
renderiza con `[innerHTML]` pasando **siempre** por `DomSanitizer`, y solo para
contenido que ha escrito una administradora autenticada. Nunca para nada que
venga de un formulario público.

**Lo que se pinta con `[innerHTML]` necesita estilos sin encapsular.** Angular
acota cada selector de un componente a un atributo que solo llevan los elementos
de su plantilla; el HTML inyectado después no lo tiene, así que las reglas no le
llegan. Por eso `BloqueTexto` usa `ViewEncapsulation.None`, con todos sus
selectores bajo `.bt` para no pisar nada. Es el mismo motivo por el que ya lo
usaba `EditorTexto` con el DOM de Jodit.

En las plantillas de correo (`functions/src/emails.ts`) rige la misma idea con
otra forma: `sustituir()` escapa todos los huecos **salvo los que terminan en
`Html`**. Es así porque el panel ofrece la lista de huecos y los escribe todos
con dos llaves; si `respuestasHtml` necesitara tres, la primera plantilla que
editara Carmen saldría con la tabla en crudo. La regla que lo sostiene: en una
clave `*Html` solo va HTML construido por nosotros, y `respuestasAHtml()` escapa
cada etiqueta y cada valor antes de montar la tabla.

### Notas de SSR

Jodit, SweetAlert2 y FullCalendar tocan `window`. Se cargan con `import()`
dinámico dentro de un guard `isPlatformBrowser`, y solo en el chunk del panel.
El panel queda excluido del prerender. Sin esto la build de SSR rompe.

**App Check va en la misma lista.** `ReCaptchaV3Provider` inyecta el script de
Google en el documento, así que en servidor lanza y la aplicación no arranca:
Cloud Run responde 503 y el único rastro está en sus logs. En `app.config.ts` se
registra solo si `typeof window !== 'undefined'`. Se mira así, y no con
`isPlatformBrowser`, porque el array de providers se construye al cargar el
módulo, fuera de contexto de inyección.

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
