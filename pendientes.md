# Pendientes · dudas abiertas y deuda técnica

Fichero vivo. Cada entrada se marca resuelta con la fecha y la decisión tomada.

Leyenda: 🔴 bloquea · 🟡 hay que resolverlo antes de producción · 🟢 mejora opcional

---

## 1. Credenciales y accesos

| # | Estado | Qué falta | Impacto mientras tanto |
|---|---|---|---|
| C1 | 🟡 | **Credenciales SMTP.** Contraseña de aplicación de la cuenta de Gmail de Veta. Pasos en `CORREOS.md`. | Los correos se encolan en `mail/` pero no salen. El código ya está: es rellenar el `.env`, guardar el secreto y desplegar. |
| C2 | 🟡 | **Emails reales de Carmen y Maripepi.** | Placeholder `gabramsua@gmail.com` en `settings/site.contacto.email` y en el remitente. Es editable desde el panel, no requiere despliegue. |
| C3 | 🟡 | **Dominio definitivo.** | De momento el subdominio de Firebase Hosting. Afecta a canonical, sitemap y `og:url`. |
| C4 | 🟢 | Cuenta de Google Analytics / Search Console. | Sin medición. |
| C5 | 🟡 | Datos fiscales y de contacto para aviso legal, privacidad y cookies. **La lista completa de lo que hay que pedirles está en `DATOS-LEGALES.md`**, listo para reenviar. | Páginas legales vacías. **Obligatorio por RGPD antes de publicar**, porque los formularios recogen datos personales. |

### Nota sobre las claves de Firebase

El `firebaseConfig` es público por diseño: viaja en el bundle de cualquier app web
de Firebase. Lo que protege los datos son las reglas de Firestore y Storage, no
ocultar la `apiKey`. Aun así, antes de publicar:

- 🟡 Restringir la API key en Google Cloud Console por referrer HTTP al dominio final.
- 🟡 Activar App Check (reCAPTCHA v3) para que solo la web real pueda escribir en
  `bookings` y `requests`. Es la defensa real contra un bot que inunde la bandeja.

---

## 2. Contenido pendiente de Carmen y Maripepi

Todo esto va con placeholder hasta que lo entreguen. **Nada de esto bloquea el
desarrollo**, pero sí bloquea la publicación.

| # | Estado | Qué falta |
|---|---|---|
| T1 | 🟡 | Textos de «Qué es Veta» y «Quiénes son Carmen y Maripepi». |
| T2 | 🟡 | Fotografías del portfolio por sección: invitaciones, seating, meseros, minutas, marcasitios, láminas, live art, acuarelas. |
| T3 | 🟡 | Precios orientativos de cada producto de papelería y unidad de venta (¿por unidad, por pack, desde X?). |
| T4 | 🟡 | Precio, duración y nº de plazas por defecto de cada taller. |
| T5 | 🟡 | Precio mensual y nº de sesiones de cada bono. |
| T6 | 🟡 | Condiciones del «Pack completo — OFERTA»: ¿% de descuento, precio cerrado, qué incluye? |
| T7 | 🟡 | Preguntas frecuentes iniciales. |
| T8 | 🟡 | Testimonios reales, con permiso de las personas citadas. |
| T9 | 🟡 | Claim de marca para el hero y la frase grande de la home. |
| T10 | 🟡 | Perfiles de Instagram y Pinterest. |

---

## 3. Decisiones de producto sin cerrar

| # | Estado | Duda |
|---|---|---|
| P1 | 🟡 | **Política de cancelación.** Si una clienta cancela una reserva confirmada, ¿se le devuelve la plaza automáticamente al cupo? Ahora mismo sí: al pasar a `cancelada`, la Function devuelve la plaza. Falta saber si hay plazo o penalización. |
| P2 | 🟡 | **Lista de espera** cuando una sesión se llena. No implementado. Decidir si interesa o si prefieren gestionarlo por email. |
| P3 | 🟡 | **Reserva de varias plazas.** El formulario pide nº de personas, pero solo se recogen los datos de quien reserva. ¿Hace falta el nombre de cada asistente? |
| P4 | 🟡 | **Talleres para eventos privados.** Es una categoría de taller, pero no tiene sesiones con fecha: es a medida. ¿Va por el formulario de presupuesto en lugar de por el calendario? Asumo que sí. |
| P5 | 🟡 | **Recordatorio previo al taller.** ¿Enviamos email X días antes? Requiere una Function programada. No está en el alcance actual. |
| P6 | 🟡 | **Bonos mensuales**: ¿cómo se renuevan? ¿Se registra en algún sitio quién tiene bono activo y hasta cuándo, o lo llevan ellas aparte? El modelo actual solo guarda la solicitud. |
| P10 | 🟡 | **Alta de administradoras: contraseña inicial visible.** Al dar de alta hay que escribir una contraseña y pasársela a mano. Ahora que existe `resetPasswordAdmin`, se podría crear la cuenta con una contraseña aleatoria que nadie ve y mandar directamente el correo de «elige tu contraseña». Media hora, reaprovechando lo que ya hay. |
| P11 | 🟡 | **La primera administradora hay que crearla a mano.** `createAdminUser` exige que quien llama ya sea admin, así que la primera cuenta y su claim se crean desde la consola de Firebase (pasos en el README). Es el arranque en frío típico; no hay forma segura de evitarlo. |
| P12 | 🟢 | **Falta el «he olvidado mi contraseña» en la pantalla de acceso.** Desde el panel ya se puede mandar el enlace (botón «Cambiar contraseña» en Administradoras), pero si las dos se quedan fuera a la vez no hay salida más que el script `npm run admin:password`. Un enlace en `/acceso` con `sendPasswordResetEmail` lo cierra. |
| P13 | 🟡 | **Secciones del portfolio fijadas en código** (`core/data/secciones-portfolio.ts`): invitaciones, seating, minutas, marcasitios, láminas, live art, acuarelas y talleres. Si quieren añadir otra, hoy hay que tocar código. ¿Merece la pena hacerlas editables desde el panel, o esta lista es estable? |
| P14 | 🟡 | **El importe del correo de confirmación se calcula como precio × personas.** No contempla descuentos, señales ni precios especiales. Si hacen alguna excepción, tendrán que decirlo a mano al responder. |
| P15 | 🟡 | **Al borrar una pregunta de un formulario**, las respuestas ya recibidas conservan su etiqueta, pero no hay forma de recuperar la pregunta. ¿Interesa un archivado en vez de un borrado? |
| P16 | 🟡 | **Alta manual de reservas desde el panel.** `CLAUDE.md` §2 la pide, pero no está hecha: el flujo real es que la clienta rellena el formulario. Haría falta para apuntar a alguien que llame por teléfono. ¿La necesitan de verdad, o basta con pasarle el enlace del formulario? |
| P7 | 🟢 | **Blog.** Fuera de alcance, con el flag preparado en `settings/site.secciones.blog`. |
| P8 | 🟡 | **Idiomas.** Asumo solo español. Si algún día hay inglés, el modelo de datos habría que replantearlo, así que conviene decidirlo pronto. |
| P9 | 🟡 | **Vacaciones**: el contador cuenta días naturales del periodo. ¿Deberían descontarse fines de semana y festivos? |

---

## 4. Deuda técnica asumida

Cosas hechas a conciencia de forma simple, que habrá que revisar si el proyecto crece.

| # | Estado | Deuda | Cuándo duele |
|---|---|---|---|
| D1 | 🟡 | **Sin App Check.** Cualquiera con el `firebaseConfig` puede escribir en `bookings` y `requests` saltándose el formulario. Las reglas validan el esquema y hay honeypot, pero eso no frena un script decidido. | Al primer ataque de spam. Activarlo antes de publicar. |
| D2 | 🟢 | **Sin paginación en los listados de contenido.** Se cargan colecciones completas donde se esperan pocos documentos (talleres, bonos, productos, FAQ, portfolio). Reservas y solicitudes usan carga progresiva con `limit`, que sí limita las lecturas. | Por encima de ~500 documentos en una colección. |
| D3 | 🟡 | **Imágenes sin redimensionar en servidor.** Se sube el original a Storage. Una foto de 8 MB se sirve tal cual. | Ya, en móvil. Solución: extensión *Resize Images* de Firebase, que genera miniaturas automáticamente. Barata de añadir. |
| D4 | 🟢 | **Estadísticas del panel calculadas en cliente**, leyendo y contando documentos. Cada visita al inicio del panel son N lecturas. | Con volumen alto de reservas. Solución: contadores agregados mantenidos por Function. |
| D5 | 🟡 | **Sin entorno de staging.** Un solo proyecto Firebase. Probar cambios de reglas contra producción es arriesgado. | Al primer despliegue con datos reales. Mínimo: usar los emuladores en local. |
| D6 | 🟢 | **Sin tests de componentes ni e2e.** Las reglas de Firestore sí están cubiertas (`npm run test:reglas`). Lo que falta es probar la interfaz. | Cuando haya que refactorizar el flujo de reservas. |
| D7 | 🟢 | **Laima solo en titulares.** Es una display con poco peso disponible y sin cursiva real. Si hiciera falta más variedad tipográfica habrá que buscar alternativa o pagar una licencia. |
| D8 | 🟡 | **Borrado de imágenes.** Al borrar un documento que referencia una imagen, el fichero se queda huérfano en Storage. Falta limpieza (Function o extensión *Delete User Data*). | Coste de Storage creciendo sin explicación. |
| D9 | 🟢 | **Jodit no es una librería Angular.** Se envuelve en un componente propio con `ControlValueAccessor`. Actualizarla de major version exigirá revisar ese wrapper. |
| D10 | 🟡 | **HTML de Jodit renderizado con `[innerHTML]`.** Va por `DomSanitizer` y solo se pinta contenido escrito por una admin autenticada. Si alguna vez se pintara contenido de origen público por esa vía, sería un XSS. Regla estricta en `CLAUDE.md` §9. |
| D11 | 🟢 | **Sin caché de datos entre navegaciones.** Cada entrada a una sección relee Firestore. Firestore ya cachea en memoria, pero no hay una capa propia. | Coste de lecturas si crece el tráfico. |
| D14 | 🟡 | **Angular fijado a la línea 20.0.x** (`~20.0.0` en vez de `^20.0.0`). Motivo: `@angular/platform-browser-dynamic` quedó deprecado en Angular 20 y su última publicación es la 20.0.7, pero `@angular/fire@20.0.1` sigue declarándolo como peer. Con `^20.0.0` npm resuelve el resto de Angular a 20.3.x y el árbol no cierra. Nos perdemos las correcciones de 20.1 a 20.3. | Revisar cuando `@angular/fire` publique una versión que suelte ese peer: entonces se puede volver a `^20.0.0` y correr `npm update`. |
| D15 | 🟡 | **`admins/{uid}.activo` y el estado real de la cuenta se mantienen en dos sitios**: el documento de Firestore y el flag `disabled` de Firebase Auth más el claim. `setAdminEnabled` los sincroniza, pero si esa Function falla a mitad quedan desincronizados. Lo que manda de verdad es el claim; el documento es solo para pintar el listado. | Si alguien ve «Activa» en el panel y no puede entrar. Solución: mover los tres cambios a una transacción o añadir una comprobación de coherencia. |
| D16 | 🟢 | **Sin límite de intentos de login propio.** Se depende del bloqueo automático de Firebase Auth (`auth/too-many-requests`), que es por IP y bastante permisivo. | Ante un ataque dirigido. App Check (D1) lo cubre en buena medida. |
| D17 | 🟡 | **Reordenar hace una escritura por elemento movido**, no una transacción. Si falla la segunda escritura, dos elementos quedan con el mismo `orden`. Firestore los desempata por id, así que no se rompe nada, pero el orden puede quedar raro hasta el siguiente movimiento. | Con conexión inestable. Solución: `writeBatch`. |
| D18 | 🟡 | **Al subir desde el selector de imágenes, a veces hay que buscarla en la lista** en vez de quedar seleccionada sola: el stream de Firestore puede no haber emitido todavía el documento recién creado. Se muestra un mensaje explicándolo. | Es un roce de usabilidad, no un fallo. Solución: devolver el documento desde el propio servicio en lugar de esperar al stream. |
| D19 | 🟢 | **El nombre de la imagen se usa como texto alternativo por defecto** al añadirla al portfolio. Si nadie lo corrige, el `alt` acaba siendo `img-2381.jpg`, que para un lector de pantalla no dice nada. | Accesibilidad. Conviene repasar los `alt` antes de publicar. |
| D20 | 🟡 | **El contenido con `activo: false` se puede leer desde la API.** El filtro se hace en cliente, y las reglas permiten leer la colección entera. Un taller oculto o un producto sin publicar son visibles para quien sepa consultar Firestore. Para un portfolio es asumible; para precios sin anunciar, quizá no. | Si alguna vez se guarda ahí algo confidencial. Solución: filtrar en la consulta con `where('activo','==',true)` y añadir el índice, o restringirlo en las reglas. |
| D21 | 🟡 | **SSR sin caché.** Cada visita a una página pública provoca lecturas de Firestore desde el servidor. Con tráfico bajo entra de sobra en el free tier, pero no escala de forma gratuita. | Con tráfico real. Solución: cabeceras `Cache-Control` en Hosting, que sirve la respuesta cacheada en CDN. |
| D23 | 🟡 | **Las plazas se comprueban en cliente al enviar la reserva.** Las reglas de Firestore no pueden validar el cupo de otra colección, así que si dos personas solicitan la última plaza a la vez, ambas solicitudes entran. No se sobrevende (el descuento real ocurre al confirmar, en transacción), pero alguien recibirá un «no hay sitio» después de haber rellenado el formulario. | Con dos solicitudes simultáneas. Es aceptable: el flujo ya es «solicitud, luego confirmación». |
| D24 | 🟡 | **Sin SMTP configurado, los correos se encolan pero no salen.** Las Functions escriben en `mail/` desde el primer día. Se resuelve con C1, sin tocar código. `enviarCorreo` descarta lo encolado hace más de 24 h, así que el primer despliegue no vacía de golpe la cola de pruebas. | Hasta que se configure el SMTP. |
| D25 | 🟢 | **El espejo `settings/cierres` se recalcula entero en cada cambio de vacaciones.** Con decenas de periodos es irrelevante; con miles sería un problema. | Nunca, siendo realistas. |
| D26 | 🟡 | **Los filtros de las bandejas actúan sobre lo ya cargado**, no sobre toda la colección. Si buscas un nombre que está en la reserva número 300 y solo has cargado 25, no aparece hasta pulsar «cargar más» varias veces. | Cuando haya cientos de reservas. Solución: mover el filtro a la consulta y añadir los índices. |
| D27 | 🟢 | **Las estadísticas del inicio leen 200 reservas y 200 solicitudes** para contar cuatro números. Es la forma directa, pero son 400 lecturas por visita. | Con volumen alto. Es la misma deuda que D4, ahora concreta: contadores agregados mantenidos por Function. |
| D28 | 🟢 | **El calendario carga todas las sesiones**, no solo las del mes visible. FullCalendar admite cargar por rango, pero exigiría una consulta por navegación. Con decenas de sesiones al año no compensa. | Por encima de unas mil sesiones. |
| D29 | 🟢 | **Las dimensiones solo las tienen las imágenes subidas a partir de ahora.** Las anteriores se siguen viendo bien, pero sin reservar el hueco: la página da un pequeño salto al cargarlas. Se arregla volviéndolas a seleccionar desde el panel. | Estético, solo la primera carga. |
| D30 | 🟡 | **Sin auditoría de Lighthouse.** No he podido ejecutar la build de producción, así que los números de rendimiento y accesibilidad son una estimación, no una medición. | Antes de publicar: `npm run build` y pasar Lighthouse sobre `npm run serve:ssr`. |
| D31 | 🟡 | **`settings/cierres` lo mantiene una Function.** Hasta que no despliegues Functions, ese documento no existe y la web pública no sabrá qué días están de vacaciones: seguirá ofreciendo esas fechas. El panel sí las bloquea al crear sesiones, porque lee `vacations` directamente. | Solo antes del primer `firebase deploy --only functions`. |
| D32 | 🟢 | **El botón «cargar más» aparece aunque no queden más registros**, cuando el total es múltiplo exacto del tamaño de página. Pulsarlo no rompe nada, simplemente no trae nada nuevo. | Estético. |
| D33 | 🟡 | **Gmail limita a ~500 envíos diarios** y el remitente será siempre una dirección `@gmail.com`, lo que resta puntos de entrega. | Con volumen alto, o cuando quieran remitente propio. Se resuelve al pasar a Resend con dominio (C3): cuatro líneas del `.env` de Functions, sin tocar código. |
| D34 | 🟢 | **`enviarCorreo` no reintenta.** Si el SMTP falla, el correo queda en `ERROR` y nadie lo reenvía solo. Se ve con `npm run correo:ver`, pero no avisa. | Ante una caída puntual del SMTP. Solución: `retry: true` en la Function, o un cron que reintente los `ERROR` recientes. Con este volumen no compensa aún. |
| D37 | 🟢 | **El motor de plantillas es un Handlebars de andar por casa** (`{{clave}}`, `{{{crudo}}}`, `{{#if}}`). No admite bucles, ni condiciones anidadas, ni `else`. | Si algún día una plantilla necesita recorrer una lista. Hoy no hace falta: la única lista, las respuestas del formulario, llega ya montada en `respuestasHtml`. |
| D38 | 🟡 | **Una plantilla guardada se congela.** Si Carmen personaliza una, deja de recibir las mejoras que hagamos en el código, y sin ningún aviso más allá del que sale al editarla. | Cuando cambiemos una plantilla y ella tenga su versión. No hay solución limpia sin versionar las plantillas; de momento se resuelve avisándola de que pulse «Volver al original». |
| D39 | 🟢 | **`formatearFechaIso` está duplicada** en `core/data/fechas.ts` y en `functions/src/emails.ts`. Cliente y Functions se compilan por separado y no comparten código. | Si se cambia una y no la otra, el panel y el correo enseñarían la misma fecha distinta. Son ocho líneas puras; compartirlas exigiría un paquete común o un paso de build. |
| D40 | 🟢 | **El correo de cambio de contraseña usa la pantalla de acción de Firebase**, alojada en `veta-estudio-creativo.firebaseapp.com` y con el aspecto por defecto de Google. Funciona, pero rompe un poco la marca. | Estético. Se personaliza en Auth → Templates, o se aloja una pantalla propia con `verifyPasswordResetCode`. |
| D41 | 🟡 | **`recaptchaSiteKey` llevaba el id del proyecto en vez de una clave de reCAPTCHA.** Al no estar vacía activaba App Check también en servidor, y el render moría con 503. Corregido: campo vacío y providers solo en navegador. | Resuelto. Queda como recordatorio de que ese campo solo admite una clave real (`6L…`) o cadena vacía. |
| D35 | 🟡 | **El despliegue de Functions necesita `FUNCTIONS_DISCOVERY_TIMEOUT=180`.** El CLI arranca el código para leer qué Functions exporta y le da 10 s; cargar `firebase-admin` tarda unos 20. | Cada despliegue. Está en `DESPLIEGUE.md`. Se quitaría cargando `firebase-admin` de forma diferida dentro de cada handler, pero es un refactor de seis ficheros para ahorrar una variable de entorno. |
| D36 | 🟡 | **`firebase-functions` fijado en `^6.3.0`, y ya va por la 7.** El CLI avisa en cada despliegue. La 7 trae cambios que rompen. | Nada mientras la 6 siga soportada. Conviene subir con calma y probar, no en medio de otra cosa. |
| D12 | 🟢 | **Fuentes servidas en `.woff` y no `.woff2`.** La conversión a woff2 necesita la extensión Brotli, que no estaba disponible al generarlas. Pesan un 25-30% más de lo necesario. Regenerar en local con `fonttools` + `brotli`, o con un conversor online. | Rendimiento en móvil con red lenta. |
| D13 | 🟢 | **Fuente Laima sin subsetear.** Se sirven los cuatro pesos completos con todos los glifos. Para una web en español bastaría un subset latin + latin-ext, y probablemente solo dos pesos. | Igual que D12, y suma. |

---

## 5. Resueltas

| # | Cuándo | Qué era y cómo se cerró |
|---|---|---|
| D6 | Repaso posterior a la fase 7 | **Sin tests.** Ya hay una suite de las reglas de Firestore (`npm run test:reglas`, 35 comprobaciones, verdes el 18/08/2026) que cubre lo que protege los datos personales. Sigue sin haber tests de componentes ni e2e, pero eso es mucho menos crítico. |
| — | Repaso posterior a la fase 7 | **Las reglas permitían descuadrar los contadores de plazas.** Una admin podía cambiar `status` de una reserva o `plazasConfirmadas` de una sesión directamente desde el cliente, saltándose la transacción de `confirmBooking`. El panel no lo hacía, pero nada lo impedía. Ahora las reglas lo rechazan y hay tests que lo comprueban. |
| — | Repaso posterior a la fase 7 | **El editor de plantillas de email salía vacío al entrar**, aunque hubiera una versión personalizada guardada: el formulario se rellenaba solo al pulsar en la lista, y los datos llegan de forma asíncrona. |
| — | Repaso posterior a la fase 7 | **El aviso de cambios sin guardar en «Textos de la web» estaba invertido**: saltaba al pulsar en la misma página y no al cambiar a otra, que es justo cuando se pierden los cambios. |
| — | Repaso posterior a la fase 7 | **Entrar directamente a `/reservar/{id}` de una sesión completa mostraba el formulario**, y el error solo aparecía al enviarlo. Ahora se avisa antes. |
| — | Al probarlo Gabriel | **Recargar una página pública tardaba cerca de un minuto**, mientras que navegar por dentro era instantáneo. El renderizado en servidor abría listeners de Firestore, que mantienen un canal permanente; Angular no da por terminado el render hasta que la aplicación se queda quieta, así que la petición esperaba a que algo expirase. En servidor se usan ahora lecturas sueltas (`getDoc` / `getDocs`), que resuelven y terminan. En navegador se siguen usando listeners. |
| D22 | Tras las vacaciones | **La imagen de portada salía del primer producto destacado** y no se podía elegir. Ahora la portada, quiénes somos, live art y acuarelas tienen sus propias imágenes, editables desde Panel → La web. |
| — | Tras las vacaciones | **El panel estaba organizado por cómo guardo los datos, no por cómo piensa quien lo usa.** «Contenido» mezclaba páginas, catálogos y biblioteca. Ahora hay «La web» (una entrada por página, en orden de aparición), «Catálogo» y «Imágenes», y cada página lista qué más sale en ella y dónde se gestiona. |
| — | Tras las vacaciones | **La cabecera pública descuadrada.** Los enlaces se encogían y partían su texto en dos renglones, cada uno por un sitio distinto. Ahora no se parten (`white-space: nowrap` y `flex: 0 0 auto`), el interletraje y los huecos son fluidos, y por debajo de 1280 px manda el menú desplegable: ocho entradas en mayúsculas no caben en horizontal por debajo de eso. |
| — | Al probarlo Gabriel | **El logotipo del pie no se veía.** Tres fallos encadenados: apuntaba al monograma cuadrado con fondo terracota sólido en vez de al logotipo transparente; declaraba `200x44` en una imagen de proporción 1:1; y sobre todo, la regla `img[width][height] { height: auto }` que yo mismo había metido en la fase 7 ganaba por especificidad a `.pie__marca img { height: 3.6rem }` y reventaba el tamaño de **todos** los logos del proyecto. Retirada la regla, recortados los logos a su contenido real y generada una versión en crema para el pie. |
| — | Al probarlo Gabriel | **El tipo «elegir entre opciones» no mostraba el campo para escribirlas**, y por tanto tampoco dejaba guardar. Un `computed()` leía `formulario.controls.tipo.value`, y el valor de un `FormControl` no es una señal: el `computed` se evaluaba una vez y no volvía a hacerlo. Ahora va por `valueChanges`. Había un segundo caso del mismo patrón en el formulario público que funcionaba de casualidad. |
| — | Al probarlo Gabriel | **Casi 200 px de vacío entre el menú y el título de cada sección.** La cabecera de sección llevaba `padding-block: 12rem`, pensado para un menú fijo, pero el menú es *sticky* y ocupa sitio en el flujo: los espacios se sumaban. |
