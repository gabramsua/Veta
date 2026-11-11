# Tamaños de imagen · qué subir en cada hueco

Para Carmen y Maripepi. La idea es no pelearse con los recortes: si la foto
llega ya con la proporción del hueco, encaja sola.

---

## Lo primero, que explica todo lo demás

Cada hueco de la web tiene una **proporción fija**. Cuando subes una foto con
otra proporción, la web no la deforma —eso quedaría horrible—, sino que **la
recorta centrada** hasta llenar el hueco.

Por eso unas fotos «se cortan» y otras no: no depende del tamaño, depende de la
forma. Una foto vertical metida en un hueco apaisado pierde arriba y abajo.

**Lo que hay que mirar es la columna «Proporción».** El tamaño en píxeles es el
mínimo para que se vea nítida en pantallas buenas; más grande no mejora nada y
hace la web más lenta.

> Truco: en el móvil, al recortar una foto, puedes elegir la proporción (1:1,
> 4:3, 16:9…). Recórtala tú antes de subirla y verás exactamente lo que va a
> salir en la web.

---

## Portada

| Hueco | Proporción | Tamaño recomendado | Notas |
|---|---|---|---|
| Portada a sangre (lo primero que se ve) | 16:9 apaisada | 2400 × 1350 | Ocupa la pantalla entera. **Deja espacio libre abajo a la izquierda**, que es donde va el texto encima. |
| Piezas destacadas | 4:3 apaisada | 1200 × 900 | Son tres en fila. |
| Pieza destacada ancha | 21:9 muy apaisada | 2000 × 860 | La que cruza las tres columnas. Es una franja: pon el motivo en el centro. |
| Rejilla de papelería | 4:3 apaisada | 1200 × 900 | Esa foto sale de cada subsección, no se sube aquí. |
| Bloque de Live art | Vertical u horizontal | 1600 × 1400 | Ocupa media pantalla de alto. Es el hueco más tolerante: se recorta a lo que haga falta. |

---

## Papelería de bodas

| Hueco | Proporción | Tamaño recomendado | Notas |
|---|---|---|---|
| Índice: las tarjetas de cada subsección | **4:5 vertical** | 1000 × 1250 | La portada de cada subsección. |
| Modelos en **rejilla de fichas** | **3:4 vertical** | 900 × 1200 | Invitaciones y marcasitios usan esta. |
| Modelos en **bloques grandes** | **4:3 apaisada** | 1300 × 975 | Minutas, PaiPai, misal, libro de testigos y pack. |
| Galería del final («Así queda») | **4:5 vertical** | 1000 × 1250 | |

**Ojo con esto**, que es la causa de que en Invitaciones unas se corten y otras
no: la misma subsección puede estar en rejilla o en bloques, y **la proporción
cambia según cuál elijas**. Se cambia en el panel, en la página de la
subsección, campo «Presentación».

- Rejilla → las fotos de los modelos van **verticales** (3:4).
- Bloques → van **apaisadas** (4:3).

---

## Live art, acuarelas y talleres

| Hueco | Proporción | Tamaño recomendado | Notas |
|---|---|---|---|
| Imagen junto al texto (live art, acuarelas, quiénes somos) | Libre | 1200 px de ancho | **No se recorta**: se respeta la proporción que traiga. Ocupa algo menos de la mitad del ancho. |
| Galería de trabajos | 4:5 vertical | 1000 × 1250 | |
| Foto de cada taller | **3:4 vertical** | 900 × 1200 | |
| Foto de un bono | 4:5 vertical | 720 × 900 | Pequeña, va al lado del precio. En móvil se recorta apaisada. |

---

## Imágenes dentro de un texto

Las que insertas con el botón de la biblioteca mientras escribes. **Estas no se
recortan nunca**: se respeta la proporción original, solo cambia el ancho.

| Tamaño que elijas | Ancho real | Sube al menos |
|---|---|---|
| Ancho completo | 680 px | 1400 px de ancho |
| Medio | 440 px | 900 px de ancho |
| Pequeña | 270 px | 560 px de ancho |

La altura, la que sea. Si pones una muy alta, el texto se va muy abajo.

---

## Peso de los archivos

| | |
|---|---|
| Formato | **JPG** para fotos. PNG solo si necesita fondo transparente. |
| Peso por foto | **Menos de 500 KB.** Por debajo de 300 KB, mejor. |
| Calidad al exportar | 80 % es más que suficiente. La diferencia con 100 % no se ve y pesa el triple. |

Esto importa más de lo que parece: **ahora mismo la web sirve el archivo tal
cual lo subes**. Una foto de 8 MB son 8 MB que se descarga cada persona que
entre, y en el móvil con datos eso es una página que no carga.

---

## Resumen para tener a mano

Si solo te quedas con tres números:

- **4:5 vertical** → portadas de subsección, galerías y bonos.
- **3:4 vertical** → modelos en rejilla y fotos de talleres.
- **4:3 apaisada** → destacados de la portada y modelos en bloques.

Y la portada a sangre, 16:9 bien grande.

---

## Para el desarrollador

Las proporciones salen de los `aspect-ratio` de cada componente; los anchos, de
`--ancho-max: 132rem` y de las columnas de cada rejilla, doblados para pantallas
de densidad alta. Si se cambia un `aspect-ratio`, hay que actualizar esta tabla:
no hay nada que la genere sola.

Los pesos dejarán de importar tanto cuando se instale la extensión *Resize
Images* (`pendientes.md` D3), que genera miniaturas automáticamente. Hasta
entonces, el original es lo que viaja.
