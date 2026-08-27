# Configurar los correos automáticos

Guía para dejar el envío funcionando con una cuenta de Gmail.

Lo envía una Function nuestra (`functions/src/enviar-correo.ts`), no la extensión
*Trigger Email*. El motivo está al final, en «Por qué no usamos la extensión».

---

## Cómo funciona

Las Functions que ya existen (reservas, solicitudes, contacto) componen el correo
con su plantilla y lo escriben en la colección `mail`. La Function `enviarCorreo`
escucha esa colección, lo manda por SMTP y anota el resultado en el mismo
documento, en `delivery.state`.

Nadie más escribe en `mail`: las reglas lo prohíben desde el cliente.

Esa separación es lo que hace que cambiar de proveedor no toque nada del resto
del código.

---

## 1. Contraseña de aplicación de Gmail

Gmail no acepta la contraseña normal de la cuenta para SMTP. Hay que generar una
específica, y para eso la cuenta necesita la verificación en dos pasos activada.

1. Entra en la cuenta de Veta → [myaccount.google.com/security](https://myaccount.google.com/security)
2. Activa **Verificación en dos pasos** si no lo está.
3. Vuelve a Seguridad → **Contraseñas de aplicaciones**.
4. Crea una con el nombre *Veta web*.

Google la enseña en cuatro grupos de cuatro letras. **Los espacios son solo para
que se lea mejor: se copia sin ellos.**

> Esa contraseña da acceso a enviar correo desde la cuenta. No la pegues en un
> chat, ni en un correo, ni en el repositorio. Solo en el comando del paso 3.

---

## 2. Datos de la cuenta

En la carpeta `functions/`, copia `.env.example` a `.env.veta-estudio-creativo` y
rellena las dos líneas de abajo:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=la-cuenta-real@gmail.com
SMTP_FROM=Veta · Estudio Creativo <la-cuenta-real@gmail.com>
```

El nombre que va delante en `SMTP_FROM` sí se puede personalizar; la dirección
tiene que ser la de la cuenta o Gmail rechaza el envío.

Ese fichero está en `.gitignore`, así que no sube al repositorio.

---

## 3. Guardar la contraseña

```bash
firebase functions:secrets:set SMTP_PASSWORD --project=veta-estudio-creativo
```

Te la pide por teclado y **no se ve al escribir**. Pégala sin espacios y pulsa
Enter. Queda en Secret Manager, cifrada, fuera del repositorio y fuera de la
consola de Firebase.

Para cambiarla algún día, se repite el mismo comando y se vuelve a desplegar.

---

## 4. Desplegar

```powershell
cd functions; npm install; cd ..
$env:FUNCTIONS_DISCOVERY_TIMEOUT=180
firebase deploy --only functions --project=veta-estudio-creativo
```

El `npm install` es necesario la primera vez: añade Nodemailer.

**El `FUNCTIONS_DISCOVERY_TIMEOUT` no es opcional.** Antes de desplegar, el CLI
arranca tu código para leer qué Functions exporta, y le da 10 segundos. Cargar
`firebase-admin` tarda unos 20 solo con sus tres módulos, así que sin la variable
el despliegue falla con:

```
Error: User code failed to load. Cannot determine backend specification.
Timeout after 10000.
```

No es un error del código: pasa con cualquier proyecto que use `firebase-admin`.
En cmd en vez de PowerShell, la línea es `set FUNCTIONS_DISCOVERY_TIMEOUT=180`.
Solo dura lo que dure esa ventana de terminal.

---

## 5. Comprobar que funciona

Rellena el formulario de contacto de la web con tu propio correo. Después:

```bash
npm run correo:ver
```

Te enseña los últimos veinte correos con su estado:

| Estado | Qué significa |
|---|---|
| **SUCCESS** | Enviado. Mira también la bandeja de entrada, y la carpeta de spam. |
| **PROCESSING** | En curso. Espera unos segundos y repite. |
| **ERROR** | El motivo sale en la misma línea. Los habituales, más abajo. |
| **DESCARTADO** | El correo llevaba encolado más de 24 h. Ver «La cola vieja». |
| **SIN PROCESAR** | La Function no está desplegada, o falló antes de arrancar. Mira los logs. |

Deberían llegar dos correos: el aviso a Veta y el acuse de recibo a quien
escribió. **Prueba a responder al aviso interno**: tiene que abrirse un correo
dirigido a la clienta, no a la propia cuenta de Veta.

### Errores habituales

- `Username and Password not accepted` — la contraseña de aplicación está mal
  copiada, o lleva los espacios que enseña Google.
- `Invalid login` — casi siempre es lo mismo que lo anterior. Comprueba también
  que `SMTP_USER` es la dirección completa, con el `@gmail.com`.
- `SMTP sin configurar` — falta el fichero `.env.veta-estudio-creativo`, o el
  secreto no se guardó. Los ficheros `.env` se leen **en el momento de
  desplegar**, así que si lo has creado después hay que volver a desplegar.
- `self signed certificate` o timeouts — el puerto no cuadra con el cifrado. 465
  va cifrado desde el principio; 587 empieza en claro y sube a TLS. La Function
  lo deduce del puerto, así que basta con poner el correcto.

Para ver el detalle:

```bash
firebase functions:log --only enviarCorreo --project=veta-estudio-creativo
```

### La cola vieja

Las Functions llevan escribiendo en `mail` desde el primer despliegue, sin nadie
que enviara nada. Sin protección, el primer despliegue vaciaría de golpe toda esa
cola de pruebas hacia direcciones inventadas, que es la forma más rápida de que
Gmail marque la cuenta como spam.

Por eso `enviarCorreo` **descarta todo lo encolado hace más de 24 horas**. No
hace falta vaciar nada a mano. Si prefieres dejarlo limpio de todos modos:

```bash
npm run correo:vaciar
```

---

## 6. Ajustar el correo de contacto

Panel → Configuración → Ajustes del sitio → Correo.

Ahí es donde llegan los avisos internos. Ahora mismo hay un placeholder
(`gabramsua@gmail.com`). Se cambia sin desplegar nada.

---

## Después

Con el correo funcionando quedan libres dos cosas que estaban esperando:

- **Recuperación de contraseña** para las administradoras (`pendientes.md` P12).
- **Alta de administradoras por invitación** en vez de contraseña visible en
  pantalla (P10).

---

## Migrar a un proveedor propio, más adelante

Gmail tiene un límite de unos 500 envíos diarios y el remitente será siempre una
dirección `@gmail.com`. Cuando haya dominio (`pendientes.md` C3), merece la pena
pasar a Resend, Brevo o similar: remitente `hola@veta.es` y mejor entrega.

Es cambiar cuatro líneas del `.env`, rehacer el secreto y desplegar:

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_FROM=Veta · Estudio Creativo <hola@veta.es>
```

**El código no se toca.** Las Functions siguen escribiendo en `mail` igual.

---

## Por qué no usamos la extensión

Esto lo hacía *Trigger Email from Firestore*, una extensión oficial de Firebase.
Se descartó en agosto de 2026, con la extensión ya a punto de instalarse.

Firebase anunció que **el servicio de extensiones se apaga el 31 de marzo de
2027**. Las que estén instaladas seguirán ejecutándose, pero a partir de esa
fecha no se podrán actualizar, **reconfigurar** ni desinstalar desde la consola
ni desde el CLI. Y para quitarlas habrá que borrar a mano en Google Cloud las
Functions, los secretos, las colas de Cloud Tasks y las cuentas de servicio que
hubieran creado.

Ese «reconfigurar» era justo lo que nos afectaba. El plan ya contemplaba cambiar
de Gmail a un proveedor propio cuando hubiera dominio, y rotar la contraseña de
aplicación si hiciera falta. Con la extensión congelada, ninguna de las dos
cosas sería posible.

Google publica herramientas de migración de extensión a Functions propias en
septiembre de 2026. Es decir: recomienda acabar exactamente donde esto empieza.

Lo que ganamos aparte de evitar la migración:

- El descarte de correos rancios de las 24 horas, que la extensión no hace.
- Los reintentos y el registro los controlamos nosotros.
- Cambiar de proveedor es editar un `.env`, no reconfigurar nada.
