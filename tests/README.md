# Tests

## Reglas de Firestore

```bash
npm run test:reglas
```

Levanta el emulador de Firestore, ejecuta los tests contra él y lo apaga.
**No toca el proyecto real**: el emulador usa un `projectId` de mentira.

Hace falta tener `firebase-tools` instalado y la JDK, que es lo que usa el
emulador de Firestore por debajo.

### Qué comprueban

Lo que de verdad protege los datos de las clientas:

- El catálogo (talleres, sesiones, productos, FAQ) se lee sin login.
- Solo una cuenta con el custom claim `admin` puede modificarlo. Tener cuenta no
  basta: una administradora desactivada pierde el claim y con él el acceso.
- Una reserva o solicitud se puede crear desde fuera, pero **solo con la forma
  exacta que espera el esquema**: nada de llegar ya confirmada, con notas
  internas rellenas, con campos de más o con una fecha de creación inventada.
- Las reservas y las solicitudes **no se pueden leer** sin ser admin. Ahí hay
  nombres, correos y teléfonos de terceras personas.
- Las vacaciones tampoco, porque llevan notas internas. Lo público es el espejo
  `settings/cierres`.
- Nadie puede escribir en `mail/`, ni siquiera una admin: si se pudiera,
  cualquiera podría mandar correos desde el dominio de Veta.
- Cualquier colección no declarada se deniega por defecto.

El último test es distinto: compara los campos del objeto de prueba con los que
declaran las propias reglas. Si alguien añade un campo a `bookings` y se olvida
de las reglas, o al revés, ese test lo caza.

### Si falla alguno

**No despliegues las reglas.** Un fallo aquí no es un test quisquilloso: es un
agujero por el que se pueden leer o manipular datos personales.

### Sobre el ruido en la salida

La ejecución escupe bastante texto en rojo: trazas de Java y líneas de
`PERMISSION_DENIED`. **Es lo esperado.** El emulador registra cada operación que
deniega, y más de la mitad de estos tests consisten precisamente en comprobar
que ciertas operaciones se deniegan. Un test en verde con un `PERMISSION_DENIED`
justo encima significa que la regla ha hecho su trabajo.

Lo único que hay que mirar es el resumen final:

```
ℹ tests 35
ℹ pass 35
ℹ fail 0
```

Si `fail` no es 0, entonces sí hay un problema.
