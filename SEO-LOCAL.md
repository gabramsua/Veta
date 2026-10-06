# SEO local · qué hace falta para que os encuentren en Sevilla

Este fichero es para Carmen y Maripepi, y para quien retome el proyecto. Explica
qué está hecho en la web, qué falta, y **por qué lo que falta no es código**.

---

## Lo primero, para que no haya malentendidos

La web ya está preparada para Google. Tiene títulos y descripciones por página,
se renderiza en el servidor (sin eso Google vería una página en blanco), declara
quién sois y dónde estáis en un formato que Google entiende, y tiene sitemap.

Eso es la mitad del trabajo. **La otra mitad no se hace programando**, y es la
que más pesa cuando alguien busca «taller de cerámica en Sevilla» o
«invitaciones de boda Sevilla». Va por orden de impacto real.

---

## 1. El Perfil de Empresa de Google · lo más importante

Cuando alguien busca algo con una ciudad, Google enseña primero un mapa con tres
negocios. Esos tres salen del **Perfil de Empresa**, no de la web. Se puede
tener la mejor web del mundo y no aparecer ahí.

La ficha de Veta **existe pero está vacía**, y una ficha vacía no compite. Es
gratis de rellenar y es la única tarea de esta lista que puede cambiar el
teléfono de sitio en cuestión de semanas.

### Qué rellenar, en orden

1. **Categoría principal.** Es el campo que más manda. Elegir la que describa lo
   que más queréis vender: `Tienda de artículos para bodas`, `Escuela de
   cerámica` o `Estudio de diseño`. Se pueden añadir categorías secundarias
   después; la principal decide para qué búsquedas os considera Google.
2. **Dirección.** Si recibís clientas en el estudio, dirección completa y
   visible. Si no queréis enseñarla, se marca como negocio que atiende a
   domicilio y se define la zona de servicio: sale igual en el mapa.
3. **Zona de servicio.** Los municipios donde de verdad hacéis bodas. En la web
   están declarados Sevilla, Dos Hermanas, Alcalá de Guadaíra, Mairena del
   Aljarafe, Tomares, Bormujos, Carmona y Utrera. **Si esa lista no es la
   buena, decídnoslo**: tiene que decir lo mismo en los dos sitios.
4. **Teléfono y horario.** El horario real, incluido el cerrado por vacaciones.
5. **Enlace a la web**, y cuando haya dominio propio, actualizarlo.
6. **Fotos.** Es lo que más se mira y donde más se gana. Del estudio, de las
   piezas, de un taller con gente. Nada de fotos de banco de imágenes.
7. **Reseñas.** Pedidlas a las clientas contentas, sobre todo a las de boda. Sin
   reseñas no se sale en el mapa, por bien que esté todo lo demás. Y responded
   a todas, también a las malas.

### Lo que tiene que coincidir letra por letra

Google cruza la ficha con la web para decidir si son el mismo negocio. Si el
nombre, la dirección o el teléfono se escriben distinto en cada sitio, duda, y
cuando duda os baja. En el oficio lo llaman **NAP consistente** (*name, address,
phone*).

| Dato | En la web se edita en | Tiene que ser igual que |
|---|---|---|
| Nombre | Es fijo: «Veta · Estudio Creativo» | El nombre de la ficha |
| Dirección | Panel → Configuración → Contacto | La dirección de la ficha |
| Teléfono | Panel → Configuración → Contacto | El teléfono de la ficha |
| Horario | Panel → Configuración → Contacto | El horario de la ficha |

Lo que pongáis en el panel viaja solo a los datos estructurados de la web. No
hay que tocar código ni desplegar: se guarda y ya está.

> **Ahora mismo esos cuatro campos están vacíos o con un valor de relleno.**
> Rellenarlos es lo que convierte la ficha técnica de la web en algo que Google
> puede cruzar con la ficha del mapa. Está anotado como `pendientes.md` C2.

---

## 2. El dominio propio

`veta-estudio-creativo.web.app` es un subdominio de Firebase. Google lo indexa,
pero no compite igual que un dominio propio, y para una empresa que factura
además transmite otra cosa a quien lo ve en un resultado.

Es la segunda palanca por tamaño y está anotada como `pendientes.md` C3. Cuando
se cambie hay que actualizar cuatro sitios en el código —están listados en
`DESPLIEGUE.md` § Dominio propio— y volver a crear la propiedad de Search
Console: el historial no se hereda.

---

## 3. Contenido con las palabras que busca la gente

Esto sí depende de Carmen, y no de nosotros: **los textos de las páginas son
editables desde el panel**, y son los que Google lee.

La idea no es repetir «Sevilla» hasta que suene raro. Es escribir como escribe
quien busca:

- «Hacemos invitaciones de boda en Sevilla» dice más que «Hacemos invitaciones».
- Nombrar sitios reales ayuda mucho: una hacienda, un pueblo, un barrio. Quien
  busca «papelería boda hacienda Sevilla» encuentra a quien los ha nombrado.
- Una página que cuenta un encargo concreto —qué pidieron, cómo se resolvió—
  vale más que tres párrafos genéricos.

Los títulos y descripciones por defecto ya nombran la localidad. Cada página
tiene además su propio título y descripción editables en el panel
(**Contenido → La web → la página → SEO**), y lo que se escriba ahí manda sobre
lo que trae el código.

---

## 4. Lo que ya hace la web sola

No hay que hacer nada de esto, pero conviene saber que está:

- **Renderizado en servidor.** Google recibe la página ya escrita. Es la
  diferencia entre que indexe el contenido o una página vacía.
- **Ficha del negocio** (`LocalBusiness`) en la portada y en contacto, con
  dirección, teléfono, horario, redes y zonas de servicio.
- **Los talleres se declaran como eventos** (`Event`), con fecha, precio y si
  quedan plazas. Es lo que permite que una sesión aparezca en Google con su
  fecha al lado.
- **Preguntas frecuentes** declaradas como tales (`FAQPage`).
- **Migas de pan** en las subpáginas, para que el resultado de Google enseñe
  «Veta › Papelería de bodas › Invitaciones» en vez de la URL.
- **Sitemap y canonical**, para que Google sepa qué páginas hay y no cuente dos
  veces la misma.
- **Imagen al compartir**, para que un enlace mandado por WhatsApp salga con la
  marca y no con un rectángulo vacío.

---

## 5. Cómo saber si funciona

En Search Console (ver `DESPLIEGUE.md` § Analítica), pestaña **Rendimiento**.
Ahí sale qué escribió la gente, en qué posición salisteis y cuántas veces os
pulsaron.

Dos avisos para no desanimarse:

- **Tarda.** Semanas para que Google rastree todo, meses para posicionar. Un
  sitio nuevo no sale el primer día por mucho que esté todo bien.
- **La ficha de Google se mide aparte**, en el propio Perfil de Empresa. Es
  normal que la ficha traiga más llamadas que la web.
