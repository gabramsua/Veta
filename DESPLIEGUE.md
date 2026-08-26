# Despliegue

Guía para publicar Veta. La primera vez lleva un rato por la configuración de
Firebase; las siguientes son dos comandos.

---

## Antes de publicar por primera vez

Estas cosas no son opcionales. Sin ellas la web funciona, pero no debería estar
en internet.

- [ ] **Aviso legal, política de privacidad y cookies redactados.**
      Panel → Contenido → Textos de la web → Textos legales.
      Es obligatorio por RGPD: los formularios recogen datos personales.
      Hacen falta los datos fiscales de Veta (`pendientes.md` C5).
- [ ] **App Check activado.** Consola de Firebase → App Check → registrar la app
      con reCAPTCHA v3, y pegar la clave de sitio en `recaptchaSiteKey` de
      `src/environments/environment.ts`. Sin esto, cualquiera puede escribir en
      `bookings` y `requests` saltándose el formulario (`pendientes.md` D1).
- [ ] **API key restringida** por referrer HTTP al dominio final, en Google Cloud
      Console → Credenciales.
- [ ] **SMTP configurado y Functions desplegadas.** Pasos en `CORREOS.md`:
      `.env.veta-estudio-creativo` con la cuenta, la contraseña de aplicación en
      Secret Manager, y `firebase deploy --only functions`.
- [ ] **Envío comprobado** con el formulario de contacto y `npm run correo:ver`.
- [ ] **Correo de contacto real** en Panel → Configuración → Ajustes del sitio.
      Ahora mismo hay un placeholder.
- [ ] **Alerta de presupuesto** en Firebase, a 10 €/mes.
- [ ] **Datos de ejemplo borrados**, si los habías creado: `npm run ejemplo:borrar`.
- [ ] Repasar los textos alternativos de las imágenes del portfolio: si nadie los
      ha tocado, son nombres de archivo (`pendientes.md` D19).

---

## Preparar el entorno, una sola vez

```bash
npm install -g firebase-tools
firebase login
firebase experiments:enable webframeworks
```

`webframeworks` es necesario para desplegar SSR: sin ese experimento activado,
Hosting no sabe construir la aplicación de Angular.

---

## Desplegar

```bash
# Antes de tocar las reglas, comprobar que siguen protegiendo lo que deben.
npm run test:reglas

# Reglas de seguridad e índices. Rápido y sin coste.
firebase deploy --only firestore:rules,firestore:indexes,storage:rules

# Cloud Functions. La primera vez tarda varios minutos.
cd functions && npm install && cd ..
firebase deploy --only functions

# La web. Construye y sube en un solo paso.
firebase deploy --only hosting
```

O todo junto:

```bash
firebase deploy
```

---

## Comprobar que ha ido bien

1. Abre la web y mira que la portada carga con contenido real.
2. Ve al panel, entra y comprueba que ves las secciones.
3. Envía un formulario de prueba y mira que llega a la bandeja.
4. Confirma esa reserva de prueba y comprueba que la plaza baja.
5. Borra la reserva de prueba.

Si algo falla en producción y no en local, mira primero los logs:

```bash
firebase functions:log --only onBookingCreated
```

---

## Dominio propio

Consola de Firebase → Hosting → Añadir dominio personalizado, y seguir los pasos
de verificación DNS. Después hay que actualizar en el código:

- `src/app/core/seo/seo.service.ts` → constante del origen en servidor.
- `public/robots.txt` → línea `Sitemap:`.
- `public/sitemap.xml` → todas las URL.

Está anotado como `pendientes.md` C3.

---

## Volver atrás

Hosting guarda las versiones anteriores:

```bash
firebase hosting:rollback
```

Las Functions no tienen rollback automático: hay que volver a desplegar la
versión anterior del código.

**Las reglas de Firestore tampoco.** Antes de tocarlas en producción, pruébalas
con los emuladores:

```bash
npm run emulators
```
