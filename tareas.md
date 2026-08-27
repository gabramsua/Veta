# Tareas

`[x]` hecho · `[ ]` pendiente · `[~]` parcial

---

## Fase 1 · Andamiaje

- [x] Proyecto Angular 20 standalone con SSR
- [x] `angular.json`, `tsconfig`, `package.json`
- [x] Providers de Firebase (App, Auth, Firestore, Storage)
- [x] `environment.ts` con la configuración del proyecto
- [x] Conversión de la fuente Laima a webfont y `@font-face`
- [x] `tokens.scss` con paleta, tipografía, espaciado y breakpoints
- [x] `base.scss` con reset, custom properties y utilidades
- [x] Separación de estilos público / panel
- [x] Layout público: cabecera, menú de dos niveles, menú móvil, pie
- [x] Layout del panel: topbar, barra lateral con grupos desplegables
- [x] Home con la secuencia de bloques de `CLAUDE.md` §3
- [x] Placeholders del resto de secciones públicas
- [x] Página 404 dentro del layout público
- [x] Modelos TypeScript de todas las colecciones
- [x] `firestore.rules` con validación de esquema en altas públicas
- [x] `storage.rules` con límites de tamaño y tipo
- [x] `firestore.indexes.json`
- [x] `firebase.json` con hosting SSR y emuladores
- [x] `README.md`, `plan-implementacion.md`, `tareas.md`, `pendientes.md`
- [x] `npm install` resuelto (Angular fijado a 20.0.x, ver deuda D14)
- [ ] **Build pendiente**: `npm run build` en local

## Fase 2 · Autenticación y panel

- [x] `AuthService` con signals y lectura del custom claim `admin`
- [x] Login en `/acceso` con persistencia seleccionable y errores traducidos
- [x] `authGuard` y `invitadoGuard`, esperando al estado inicial de Firebase
- [x] Cierre de sesión con confirmación desde el layout del panel
- [x] `ColeccionBase`: acceso tipado a Firestore
- [x] `AlertasService` con SweetAlert2 tematizado y carga diferida
- [x] Estilos de formulario, tabla, botones y estados del panel
- [x] Function `createAdminUser` con custom claim
- [x] Function `setAdminEnabled` con revocación de tokens
- [x] CRUD de administradoras (alta, activar, desactivar)
- [x] Ajustes del sitio: secciones activables, contacto, redes, aviso global
- [x] Wrapper de Jodit con `ControlValueAccessor`, solo en navegador
- [x] Pipe `htmlSeguro` con `DomSanitizer`
- [x] Placeholder para las rutas del panel aún no implementadas
- [ ] **Pendiente de tu parte**: crear la primera administradora (ver README)
- [ ] **Build y prueba manual pendientes**

## Fase 3 · Contenido

- [x] Componentes compartidos: cabecera de sección, estado vacío, subir/bajar
- [x] Biblioteca de medios: subida múltiple, categorías, filtros, galería y lightbox
- [x] Selector de imágenes reutilizable, con subida sin salir del formulario
- [x] Talleres, con descripción en Jodit y galería propia
- [x] Sesiones: fechas, plazas por sesión y validación de solapamientos
- [x] Bonos mensuales
- [x] Productos de papelería, con pestañas por subsección y destacados
- [x] Portfolio con ordenación dentro de cada sección
- [x] Preguntas frecuentes con respuesta en Jodit
- [x] Frases y testimonios
- [ ] **Build y prueba manual pendientes**

## Fase 4 · Web pública

- [x] `SeoService`: título, meta, canonical, Open Graph y JSON-LD, funcionando en SSR
- [x] Capa de lectura pública, segura para SSR y sin índices compuestos
- [x] Catálogo de textos editables y pantalla «Textos de la web» en el panel
- [x] Layout público leyendo secciones activas, redes, contacto y aviso global
- [x] Home conectada a Firestore
- [x] Quiénes somos
- [x] Papelería de bodas y sus 6 subsecciones, con galería del portfolio
- [x] Live art
- [x] Acuarelas y encargos
- [x] Talleres, con fechas y plazas reales, y bonos
- [x] Preguntas frecuentes, con datos estructurados FAQPage
- [x] Contacto
- [x] Aviso legal, privacidad y cookies (con texto pendiente de redactar)
- [x] `robots.txt` y `sitemap.xml`
- [ ] **Formularios**: llegan en la fase 5
- [ ] **Build y prueba manual pendientes**

## Fase 5 · Reservas

- [x] Preguntas extra configurables por formulario, con orden y tipos
- [x] Formulario público reutilizable con campos fijos y preguntas dinámicas
- [x] Honeypot antispam y aceptación de política de privacidad
- [x] Reserva de plaza en una sesión, validando plazas libres
- [x] Solicitud de bono mensual
- [x] Presupuestos de papelería, live art, encargos y contacto
- [x] Vacaciones: periodos, contador anual y bloqueo al crear sesiones
- [x] Espejo público de cierres, para no exponer las notas internas
- [x] Plantillas de email editables, con vuelta al texto original
- [x] `onRequestCreated`, `onBookingCreated` y `onBookingUpdated`
- [x] `confirmBooking` en transacción
- [x] `onVacationWritten` (espejo público de cierres)
- [x] Los días de vacaciones se calculan desde `vacations`; el cron anual sobraba
- [x] `enviarCorreo`: Function propia con Nodemailer sobre la cola `mail/`
- [ ] **Pendiente de tu parte**: configurar el SMTP y desplegar (`CORREOS.md`, necesita C1)
- [ ] **Build y prueba manual pendientes**

## Fase 6 · Bandejas

- [x] Bandeja de reservas con filtros, búsqueda y carga progresiva
- [x] Confirmar y cancelar reservas, moviendo plazas por `confirmBooking`
- [x] Notas internas en reservas y solicitudes
- [x] Bandeja de solicitudes con estados y respuesta por correo
- [x] Componente de respuestas legible aunque se borre la pregunta
- [x] Calendario con vistas de mes, semana y lista, y vacaciones marcadas
- [x] Estadísticas reales en el inicio, con enlaces a lo que requiere atención
- [ ] **Alta manual de reservas desde el panel**: pendiente, ver P16
- [ ] **Build y prueba manual pendientes**

## Fase 7 · Pulido

- [x] Diálogos accesibles: Escape, foco devuelto y scroll bloqueado
- [x] `aria-current` en la navegación, y menú móvil `inert` cuando está cerrado
- [x] Dimensiones en las imágenes para evitar saltos de maquetación
- [x] Presupuestos de bundle y cabeceras de caché por tipo de recurso
- [x] Cabeceras de seguridad en Hosting
- [x] App Check integrado, activable con solo pegar la clave
- [x] Repaso responsive del panel y objetivos táctiles de 44 px
- [x] `DESPLIEGUE.md` con pasos y comprobaciones previas
- [ ] **Pendiente de ti**: activar App Check, restringir la API key y redactar
      los textos legales antes de publicar (ver `DESPLIEGUE.md`)
- [ ] **Pendiente de ti**: dominio propio y actualizar canonical, sitemap y robots
- [ ] **Auditoría con Lighthouse sobre la build de producción**: no la he podido
      ejecutar, hay que hacerla en local

---

## Posterior a las fases · repaso y herramientas

- [x] Tests de las reglas de Firestore con el emulador (38 comprobaciones)
- [x] Reglas endurecidas: los contadores de plazas ya no se pueden descuadrar
      desde el cliente
- [x] Datos de ejemplo con borrado selectivo (`ejemplo:crear` / `ejemplo:borrar`)
- [x] Repaso crítico de las siete fases, con cuatro fallos corregidos
      (ver `pendientes.md` §5)
- [x] **`npm run test:reglas` ejecutado el 18/08/2026: 35 de 35 en verde**

---

## Tras las vacaciones · UX del panel

- [x] Menú reorganizado: «La web» por orden de aparición, «Catálogo», «Imágenes»
- [x] Editor por página, con los bloques en el orden en que se ven
- [x] Imágenes propias por página: portada, quiénes somos, live art, acuarelas
- [x] Cada página lista qué más sale en ella y dónde se gestiona
- [x] Cabecera pública cuadrada: enlaces sin partir y menú desplegable bajo 1280 px
- [ ] **Enseñárselo a Carmen y ver dónde se atasca**: es la única prueba que vale
