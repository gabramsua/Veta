# Veta · Estudio Creativo

Web pública y panel de gestión para Veta, estudio creativo en Sevilla.
Angular 20 con SSR contra Firebase, sin backend propio.

## Puesta en marcha

```bash
npm install
npm start           # http://localhost:4200
```

### Por qué Angular está fijado a 20.0.x

`@angular/fire@20.0.1` declara `@angular/platform-browser-dynamic` como peer
dependency, pero ese paquete quedó deprecado en Angular 20 y dejó de publicarse
en la 20.0.7. Con rangos `^20.0.0` npm resuelve el resto de Angular a 20.3.x y el
árbol de dependencias no cierra (`ERESOLVE`).

Por eso todos los paquetes de Angular usan `~20.0.0`, que los mantiene dentro de
la 20.0.x, donde todas las piezas encajan entre sí. **No uses `--force` ni
`--legacy-peer-deps`**: instalan un árbol incoherente y los fallos aparecen
después, en tiempo de ejecución.

Cuando `@angular/fire` publique una versión sin ese peer, se puede volver a
`^20.0.0` y actualizar.

Otros comandos:

```bash
npm run build       # build de producción con SSR
npm run serve:ssr   # sirve la build de SSR en el puerto 4000
npm run emulators   # emuladores de Firebase (Auth, Firestore, Storage)
```

## Qué hay que hacer una sola vez en Firebase

El proyecto `veta-estudio-creativo` ya existe y su configuración está en
`src/environments/`. Falta activar por consola:

1. **Plan Blaze** con alerta de presupuesto a 10 €/mes.
2. **Firestore** en región `eur3`, modo producción.
3. **Authentication** → proveedor Email/contraseña.
4. **Storage**.
5. **Hosting**.

Después, desde la raíz del proyecto:

```bash
npm install -g firebase-tools
firebase login
firebase experiments:enable webframeworks   # necesario para desplegar SSR
firebase deploy --only firestore:rules,storage:rules
```

## Crear la primera administradora

`createAdminUser` exige que quien la llama ya sea administradora, así que la
primera cuenta hay que crearla desde fuera de la app. Hay un script para eso.

### 1. Activa Authentication

Consola de Firebase → **Authentication** → *Comenzar* → habilita el proveedor
**Correo electrónico/contraseña**. Sin esto el login devuelve
`auth/operation-not-allowed`.

### 2. Descarga una clave de cuenta de servicio

Consola de Firebase → ⚙ **Configuración del proyecto** → pestaña **Cuentas de
servicio** → *Generar nueva clave privada*. Guarda el JSON en la raíz del
proyecto como `clave-servicio.json`.

> Esa clave da acceso total al proyecto, saltándose las reglas de seguridad.
> Ya está en `.gitignore`. Bórrala en cuanto termines.

### 3. Ejecuta el script

```bash
npm run admin:crear
```

Te pide nombre, correo y contraseña, y deja las tres cosas que hacen falta:
el usuario en Authentication, el custom claim `admin` en su token, y el
documento `admins/{uid}` en Firestore.

Es idempotente. Si ya habías creado el usuario a medias, lo detecta y completa
solo lo que falte, sin duplicar nada ni cambiar la contraseña.

### 4. Entra

```bash
npm start
```

http://localhost:4200/acceso

### Si algo no funciona

```bash
npm run admin:ver
```

Muestra, para cada cuenta, si el usuario existe, si está habilitado, si tiene el
claim y si tiene documento — y qué falta en cada caso. Casi todos los fallos de
acceso son una de esas tres cosas.

Para cambiar una contraseña olvidada mientras no haya correo configurado:

```bash
npm run admin:password
```

### Después de la primera

El resto de cuentas se crean desde *Panel → Configuración → Administradoras*,
sin scripts ni claves.

## Estructura

```
src/app/core/models      interfaces de las colecciones de Firestore
src/app/core/data        acceso a datos y constantes de navegación
src/app/layout           layout público y layout del panel
src/app/features/public  secciones de la web
src/app/features/admin   secciones del panel
src/app/shared           componentes reutilizables
src/styles               tokens, base y temas público / panel
```

Los estilos del tema público y los del panel no se mezclan. `tokens.scss` solo
contiene Sass (variables de breakpoint y mixins), por lo que se puede importar
desde cualquier componente con `@use 'tokens' as *;` sin duplicar CSS. Las
custom properties viven en `base.scss` y se emiten una sola vez.

## Imágenes de marca

En `src/assets/marca/` viven las versiones ya preparadas, derivadas de los
originales de la raíz del proyecto:

| Archivo | Para qué |
|---|---|
| `veta-logo.png` | Logotipo horizontal en terracota, fondo transparente, recortado al contenido. Cabecera, panel y acceso. |
| `veta-logo-crema.png` | El mismo logotipo repintado en crema, para el pie sobre verde oliva. |
| `veta-monograma.png` | Monograma cuadrado sobre oliva. Favicon. |
| `veta-og.png` | 1200x630 sobre crema, para cuando se comparte un enlace. |

Los originales (`lodo-veta-*.png` en la raíz) tienen mucho aire alrededor y
algunos llevan fondo sólido: no deben usarse directamente en la web.

## Datos de ejemplo

Para enseñar la web con aspecto real antes de que haya contenido definitivo:

```bash
npm run ejemplo:crear    # talleres, sesiones, papelería, portfolio, FAQ, testimonios
npm run ejemplo:borrar   # lo quita todo
```

Necesita la misma `clave-servicio.json` que los scripts de administradoras.

Cada documento y cada imagen que crea queda anotado en `_semilla/registro`, y el
borrado solo toca esa lista: **el contenido real que hayáis creado de por medio
no se toca**. Los textos de las páginas se preguntan aparte, porque es fácil
haber escrito encima algo que sí queréis conservar.

Las imágenes son marcadores SVG generados al vuelo, no fotos: se ve la
maquetación con imágenes de verdad sin inventarse fotografías que no son de Veta.

## Despliegue

Los pasos y la lista de comprobaciones previas están en `DESPLIEGUE.md`.

## Documentos del proyecto

- `CLAUDE.md` — especificación funcional y técnica. Fuente de verdad.
- `plan-implementacion.md` — plan por fases, con las decisiones de cada una.
- `tareas.md` — estado de cada tarea.
- `pendientes.md` — dudas abiertas y deuda técnica.
- `DESPLIEGUE.md` — cómo publicar y qué comprobar antes.
- `DATOS-LEGALES.md` — qué hay que pedirle a Carmen para los textos legales.
- `CORREOS.md` — cómo configurar los correos automáticos.
