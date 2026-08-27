# Pruebas manuales del correo

Diecisiete pruebas sobre las seis plantillas que existen. Las cinco primeras son
las imprescindibles; el resto cubre casos que no se ven hasta que fallan delante
de una clienta.

Marca lo que vayas comprobando. Si algo falla, la última columna dice dónde mirar.

---

## Preparación

```bash
npm start
```

Necesitas datos con los que jugar. Si no los tienes:

```bash
npm run ejemplo:crear
```

Y al terminar todas las pruebas, `npm run ejemplo:borrar`.

**Usa siempre tu propio correo** en los formularios. El aviso interno va a
`settings/site.contacto.email`, que ahora es `gabramsua@gmail.com`, o sea que
todo te llega a ti: verás las dos caras de cada envío.

Ten a mano una segunda pestaña con la consola de Firebase → Firestore →
colección `mail`. Cada documento tiene `delivery.state`, y ahí se ve al momento
si el correo salió o falló, sin esperar a la bandeja.

---

## Las seis plantillas

Conviene tener claro qué dispara qué, porque las pruebas no son más que recorrer
esta tabla:

|      Plantilla       |          Cuándo sale          |      A quién     |
|----------------------|-------------------------------|------------------|
| `solicitud-veta`     | Se crea un `requests`         | A Veta           |
| `solicitud-cliente`  | Se crea un `requests`         | A quien escribió |
| `reserva-veta`       | Se crea un `bookings`         | A Veta           |
| `reserva-cliente`    | Se crea un `bookings`         | A quien reservó  |
| `reserva-confirmada` | El status pasa a `confirmada` | A quien reservó  |
| `reserva-cancelada`  | El status pasa a `cancelada`  | A quien reservó  |

---

## Bloque A · Solicitudes de presupuesto

Las cuatro secciones escriben en la misma colección y usan las mismas dos
plantillas. Lo único que cambia es la etiqueta `{{tipo}}`, así que la primera se
mira con lupa y las otras tres son un vistazo al asunto.

### 1. Contacto

- [ ] Rellena `/contacto` con tu correo.
- [ ] Llegan **dos** correos en menos de un minuto.
- [ ] El interno tiene de asunto `Nueva solicitud de contacto · TU NOMBRE`.
- [ ] Trae tu nombre, correo y teléfono.
- [ ] El del cliente dice «Gracias, TU NOMBRE», y debajo trae un **Resumen de tu
      solicitud** con el tipo, tu nombre, tu correo y tu teléfono.
- [ ] No lleva ningún `{{hueco}}` sin sustituir.
- [ ] Ninguno cae en spam.

> Si no llega nada: `firebase functions:log --only enviarCorreo`. Si sale
> `Username and Password not accepted`, la contraseña de aplicación lleva los
> espacios que muestra Google.

### 2. Papelería de bodas

Esta se mira con calma: es la única con selector de piezas.

- [ ] Entra en **Minutas** y pulsa «Pedir presupuesto». La URL lleva
      `?sobre=minutas` y en el formulario **Minutas ya viene marcada**.
- [ ] Marca también **Marcasitios** y envía.
- [ ] El asunto del interno dice
      `Nueva solicitud de papelería de bodas · Minutas, Marcasitios · TU NOMBRE`.
- [ ] Dentro, un recuadro **Piden: Minutas, Marcasitios**.
- [ ] El acuse de la clienta trae una fila **Piezas** con las dos.
- [ ] Panel → Solicitudes: bajo el nombre salen las piezas en terracota.
- [ ] Desmarca todo e intenta enviar: no deja, y avisa de que marques al menos
      una.
- [ ] Entra por `/solicitar/papeleria` **sin** venir de ninguna subsección: no
      hay nada premarcado, pero el selector sigue ahí.
- [ ] Prueba una URL inventada, `/solicitar/papeleria?sobre=jarrones`: no premarca
      nada y el formulario funciona igual.

### 3. Live art

- [ ] El asunto dice `Nueva solicitud de live art`.

### 4. Acuarelas y encargos

- [ ] El asunto dice `Nueva solicitud de encargo`.
- [ ] **No aparece el selector de piezas**: es solo de papelería.
- [ ] En el correo no queda un recuadro «Piden:» vacío, ni una fila «Piezas».

---

## Bloque B · Reserva de taller

Aquí está lo que de verdad puede romperse: hay fechas, precios y plazas.

### 5. Solicitud de plaza

- [ ] Elige una sesión con plazas libres y reserva **2 personas**.
- [ ] Llegan dos correos.
- [ ] El interno lleva el **nombre del taller** y la **fecha en español**
      («martes, 15 de septiembre de 2026, 18:00»), no un número raro ni vacío.
- [ ] Dice «2 persona(s)».
- [ ] Recuerda que la plaza no se descuenta hasta confirmar.
- [ ] El del cliente dice «solicitud de **2 plaza(s)**» y avisa en el recuadro de
      que **la plaza todavía no está reservada**.
- [ ] Su resumen trae una fila **Taller** con el nombre, la **Fecha**, las
      **Personas** y tus datos de contacto.
- [ ] En el panel, la sesión sigue con las **mismas plazas libres que antes**.

> La hora se calcula en `Europe/Madrid`. Si sale desplazada, es la zona horaria.

### 6. Confirmar la reserva

- [ ] Panel → Reservas → confirma la de antes.
- [ ] Llega **un** correo, asunto `¡Plaza confirmada! · NOMBRE DEL TALLER`.
- [ ] El importe es **precio del taller × 2**. Compruébalo con la calculadora:
      es el número que más fácil se descuadra.
- [ ] Menciona el pago en el estudio o por Bizum.
- [ ] En el panel, las plazas libres han bajado **en 2**.

### 7. Cancelar una reserva confirmada

- [ ] Cancela esa misma reserva.
- [ ] Llega el correo de cancelación.
- [ ] Las plazas **vuelven** a estar libres.

### 8. Cancelar una que nunca se confirmó

- [ ] Haz otra solicitud y cancélala sin confirmarla.
- [ ] Llega el correo de cancelación.
- [ ] Las plazas **no se mueven**, ni arriba ni abajo. Si suben, hay un bug:
      estaríamos devolviendo una plaza que nunca se descontó.

### 9. Intentar confirmar sin sitio

- [ ] Busca o crea una sesión con **1 plaza libre** y solicita **3**.
- [ ] Al confirmar, el panel da un error explicando cuántas quedan.
- [ ] **No sale ningún correo.** Es lo importante: nadie recibe un «plaza
      confirmada» que no es verdad.

---

## Bloque C · Bonos mensuales

Un bono no tiene sesión ni fecha, y ese hueco vacío es justo donde se ven las
costuras.

### 10. Solicitud de bono

- [ ] Solicita un bono desde la web.
- [ ] Llegan los dos correos con el **título del bono**.
- [ ] En el del cliente **no aparece** un « el » suelto donde iría la fecha, y en
      el resumen **no hay fila de Fecha**.
- [ ] La fila del resumen dice **Bono**, no «Taller».
- [ ] En el interno **no queda una línea en blanco** bajo el título del bono.

### 11. Confirmar un bono

- [ ] Confirma la solicitud desde el panel.
- [ ] Llega el correo de confirmación.
- [ ] El importe es el **precio mensual × personas**.
- [ ] **Ninguna sesión de taller cambia sus plazas.** Los bonos no consumen cupo.

---

## Bloque D · Detalles que solo se ven cuando fallan

### 12. Responder al aviso interno

- [ ] Abre cualquiera de los avisos internos y pulsa **Responder**.
- [ ] El destinatario es la dirección **del formulario**, no la cuenta de Veta.

Sin esto, Carmen le contesta a su propio buzón y el correo se queda ahí. Los de
confirmación y cancelación no llevan `replyTo`: van a la clienta y responder a
Veta es lo correcto.

### 13. Preguntas extra del formulario

- [ ] Panel → Preguntas de formularios → añade una de texto, una de opciones y
      una de **fecha** al formulario de contacto.
- [ ] En la web, la de fecha sale con el calendario del navegador, no con un
      campo de texto.
- [ ] En el correo y en el panel se lee **12 de junio de 2027**, no `2027-06-12`.
- [ ] Prueba un 1 de enero y un 31 de diciembre: ni se adelanta ni se atrasa un
      día. Ahí es donde asomaría un problema de husos horarios.
- [ ] El calendario **no deja elegir días anteriores a hoy**, y hoy sí se puede.
- [ ] Escribe a mano una fecha del año pasado y dale a enviar: no envía, y avisa
      bajo ese campo de que la fecha ya ha pasado.
- [ ] Rellena el formulario contestándolas.
- [ ] En el correo interno sale una **tabla** con la pregunta a la izquierda y la
      respuesta a la derecha. Si ves el HTML en crudo (`<table style=...`), la
      plantilla se está escapando: avísame.
- [ ] En el acuse de recibo de la clienta sale la misma tabla bajo «Lo que nos
      has contado».
- [ ] Panel → Plantillas de email → pega el hueco `{{respuestasHtml}}` tal cual
      lo ofrece el panel, guarda y manda otra solicitud: la tabla tiene que
      seguir viéndose formateada. Con dos llaves o con tres, da igual.
- [ ] **Borra ahora esa pregunta** desde el panel y vuelve a mirar el correo que
      ya te llegó: la etiqueta tiene que seguir viéndose. El texto se guarda con
      la respuesta a propósito, para que un correo viejo se siga entendiendo.

### 14. Plantilla editada desde el panel

- [ ] Panel → Plantillas de email → abre una que ponga **De serie**. El editor
      trae ya el texto real del correo, no un cuadro vacío, y sale un aviso
      explicando que al guardar deja de actualizarse sola.
- [ ] Cambia el asunto de `solicitud-cliente` y guarda. La etiqueta pasa a
      **Personalizada** y el aviso desaparece.
- [ ] Manda una solicitud: llega con **tu** asunto.
- [ ] «Volver al original»: el editor recupera el texto de serie sin recargar la
      página, y el siguiente correo vuelve a ser el de siempre.

Esto verifica las dos mitades: que la plantilla de Firestore gana sobre la del
código —lo que permite a Carmen cambiar textos sin desplegar— y que puede volver
atrás sin haber perdido el original por el camino.

> Ojo con esto al depurar: **si hay una plantilla guardada, ninguna mejora que
> hagamos en el código llega a los correos.** Si tocamos una plantilla y el
> correo sigue igual, mira primero la colección `templates` en Firestore.

### 15. Acentos y símbolos

- [ ] Manda un formulario con nombre `Ángela Muñoz-Cañás` y un comentario con
      `<`, `>`, `&` y comillas.
- [ ] En el correo se ven tal cual, sin `Ã±` ni `&amp;amp;`.
- [ ] El HTML **no se rompe**: si escribes `<script>` o `<b>hola</b>`, tiene que
      aparecer como texto plano, no interpretarse. Es una entrada pública y va
      escapada a propósito.

### 16. Entregabilidad

- [ ] Manda una solicitud a una dirección de **fuera de Gmail** (Outlook, iCloud,
      o el correo del trabajo).
- [ ] Llega, y mira también spam.
- [ ] Ábrelo en el **móvil**: el ancho máximo es de 600 px, no debería salir
      cortado ni pedir zoom.

Con dominio propio y SPF/DKIM esto mejora bastante. Mientras el remitente sea
`@gmail.com`, algún filtro corporativo puede ponerse tonto.

### 17. Cambiar el correo de destino

- [ ] Panel → Configuración → Ajustes del sitio → pon otra dirección tuya.
- [ ] Manda una solicitud: el aviso interno llega **a la nueva**.
- [ ] Vuelve a dejar la de antes.

Esto es lo que harán Carmen y Maripepi cuando decidan a qué buzón quieren que les
lleguen los avisos. No requiere desplegar nada, y conviene comprobar que es
verdad antes de decírselo.

---

## Al terminar

```bash
npm run ejemplo:borrar
```

Y anota en `pendientes.md` cualquier cosa rara que hayas visto, aunque parezca
menor.
