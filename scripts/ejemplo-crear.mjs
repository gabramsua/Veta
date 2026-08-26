/**
 * Rellena Firestore con contenido de ejemplo creíble.
 *
 *   npm run ejemplo:crear
 *
 * Sirve para enseñarle la web a Carmen y Maripepi con aspecto real, en vez de
 * con estados vacíos por todas partes. Los textos son plausibles pero
 * evidentemente de relleno: nadie debería confundirlos con contenido definitivo.
 *
 * Todo queda anotado en `_semilla/registro`, así que `npm run ejemplo:borrar`
 * lo quita sin tocar nada más.
 */

import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import { PALETA, arrancar, enDias, guardarRegistro, leerRegistro, subirMarcador } from './comun-ejemplo.mjs';

const { db, bucket } = arrancar();

const documentos = [];
const archivos = [];

async function crear(coleccion, datos) {
  const referencia = await db.collection(coleccion).add({ ...datos, _ejemplo: true });
  documentos.push({ coleccion, id: referencia.id });
  return referencia.id;
}

async function crearConId(ruta, datos) {
  await db.doc(ruta).set({ ...datos, _ejemplo: true }, { merge: true });
  const [coleccion, id] = ruta.split('/');
  documentos.push({ coleccion, id });
}

async function imagen(nombre, texto, fondo, ancho, alto) {
  const datos = await subirMarcador(bucket, nombre, texto, fondo, ancho, alto);
  archivos.push(datos.storagePath);

  await crear('media', {
    nombre: `${texto}.svg`,
    url: datos.url,
    storagePath: datos.storagePath,
    tipo: 'imagen',
    categoriaId: null,
    alt: texto,
    bytes: datos.bytes,
    width: datos.width,
    height: datos.height,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { url: datos.url, storagePath: datos.storagePath, alt: texto, orden: 0, width: datos.width, height: datos.height };
}

console.log('\n  Creando datos de ejemplo…\n');

// --- Talleres ---
const talleres = [
  { slug: 'ceramica-iniciacion', categoria: 'ceramica', titulo: 'Cerámica de iniciación', precio: 45, duracionMin: 180,
    descripcion: '<p>Una mañana entera con las manos en el barro. No hace falta saber nada: empezamos por el principio, con el torno y con las manos, y cada persona se lleva su pieza a casa.</p><p>Incluye materiales, cocción y delantal.</p>' },
  { slug: 'acuarela-botanica', categoria: 'pintura', titulo: 'Acuarela botánica', precio: 38, duracionMin: 150,
    descripcion: '<p>Aprende a mirar una flor antes de pintarla. Trabajamos el boceto, la mancha y el detalle, con papel de algodón y pigmentos de calidad.</p>' },
  { slug: 'taller-infantil-arcilla', categoria: 'infantil', titulo: 'Arcilla para peques', precio: 22, duracionMin: 90,
    descripcion: '<p>Para niñas y niños de 6 a 11 años. Modelado libre, mucho juego y una pieza para llevarse a casa la semana siguiente, ya cocida.</p>' },
  { slug: 'eventos-privados', categoria: 'eventos', titulo: 'Talleres para grupos privados', precio: 0, duracionMin: 180,
    descripcion: '<p>Despedidas, cumpleaños, equipos de trabajo. Adaptamos la actividad al grupo y al espacio. Cuéntanos qué tenéis en mente y os preparamos un presupuesto.</p>' },
];

const idsTaller = {};

for (const [indice, taller] of talleres.entries()) {
  const foto = await imagen(
    `taller-${taller.slug}`,
    taller.titulo,
    indice % 2 === 0 ? PALETA.arena : PALETA.crema,
    1200,
    1600,
  );

  idsTaller[taller.slug] = await crear('workshops', {
    ...taller,
    imagenes: [foto],
    activo: true,
    orden: indice,
  });
}

console.log(`  ✓ ${talleres.length} talleres`);

// --- Sesiones: unas cuantas fechas próximas, con distinta ocupación ---
const sesiones = [
  { taller: 'ceramica-iniciacion', dias: 6, plazas: 8, confirmadas: 3 },
  { taller: 'ceramica-iniciacion', dias: 20, plazas: 8, confirmadas: 0 },
  { taller: 'acuarela-botanica', dias: 9, plazas: 10, confirmadas: 8 },
  { taller: 'acuarela-botanica', dias: 27, plazas: 10, confirmadas: 1 },
  { taller: 'taller-infantil-arcilla', dias: 13, plazas: 12, confirmadas: 12 },
];

for (const sesion of sesiones) {
  const inicio = enDias(sesion.dias);
  const fin = new Date(inicio.getTime() + 3 * 60 * 60 * 1000);

  await crear('sessions', {
    workshopId: idsTaller[sesion.taller],
    fechaInicio: Timestamp.fromDate(inicio),
    fechaFin: Timestamp.fromDate(fin),
    plazasTotales: sesion.plazas,
    plazasConfirmadas: sesion.confirmadas,
    activa: true,
    notasInternas: '',
  });
}

console.log(`  ✓ ${sesiones.length} sesiones (una llena, una casi llena)`);

// --- Bonos ---
const bonos = [
  { categoria: 'ceramica', titulo: 'Bono cerámica', precioMes: 120, sesionesMes: 4,
    descripcion: '<p>Cuatro sesiones al mes, un día fijo a la semana. Materiales y cocción incluidos.</p>' },
  { categoria: 'pintura', titulo: 'Bono pintura', precioMes: 95, sesionesMes: 4,
    descripcion: '<p>Cuatro sesiones al mes para trabajar tu propio proyecto con acompañamiento.</p>' },
  { categoria: 'infantil', titulo: 'Bono infantil', precioMes: 70, sesionesMes: 4,
    descripcion: '<p>Una tarde a la semana de arcilla, pintura y experimentación.</p>' },
];

for (const [indice, bono] of bonos.entries()) {
  await crear('bonos', { ...bono, activo: true, orden: indice });
}

console.log(`  ✓ ${bonos.length} bonos`);

// --- Papelería ---
const productos = [
  { categoria: 'invitaciones', titulo: 'Invitación Hortensias', precioDesde: 2.4, unidad: 'unidad', destacado: true,
    descripcion: '<p>Acuarela original de hortensias, impresa sobre papel de algodón de 300 g. Se personaliza con vuestros nombres, fecha y lugar.</p>' },
  { categoria: 'invitaciones', titulo: 'Invitación Olivo', precioDesde: 2.1, unidad: 'unidad', destacado: false,
    descripcion: '<p>Rama de olivo pintada a mano. Sobria y muy del sur.</p>' },
  { categoria: 'seating', titulo: 'Seating plan ilustrado', precioDesde: 145, unidad: 'pieza', destacado: true,
    descripcion: '<p>Panel ilustrado con el lugar de la celebración y la distribución de mesas, en el tamaño que necesitéis.</p>' },
  { categoria: 'minutas', titulo: 'Minuta Flores de Otoño', precioDesde: 0.95, unidad: 'unidad', destacado: false,
    descripcion: '<p>Minuta a dos caras con orla floral en acuarela.</p>' },
  { categoria: 'marcasitios', titulo: 'Marcasitios troquelado', precioDesde: 1.1, unidad: 'unidad', destacado: false,
    descripcion: '<p>Con el nombre de cada invitado en caligrafía, troquelado a mano.</p>' },
  { categoria: 'laminas', titulo: 'Lámina personalizada', precioDesde: 65, unidad: 'pieza', destacado: true,
    descripcion: '<p>Acuarela original del lugar que elijáis, enmarcada o sin enmarcar.</p>' },
  { categoria: 'pack', titulo: 'Pack papelería completa', precioDesde: 0, unidad: 'presupuesto', destacado: false,
    descripcion: '<p>Invitaciones, seating, meseros, minutas y marcasitios con un mismo hilo conductor. <strong>Descuento por contratar el conjunto.</strong></p>' },
];

for (const [indice, producto] of productos.entries()) {
  const foto = await imagen(
    `producto-${indice}`,
    producto.titulo,
    indice % 3 === 0 ? PALETA.crema : indice % 3 === 1 ? PALETA.arena : PALETA.arenaOsc,
    1200,
    1500,
  );

  await crear('products', { ...producto, imagenes: [foto], activo: true, orden: indice });
}

console.log(`  ✓ ${productos.length} productos de papelería`);

// --- Portfolio ---
const secciones = ['invitaciones', 'seating', 'minutas', 'marcasitios', 'laminas', 'liveart', 'acuarelas', 'talleres'];
let ordenPortfolio = 0;

for (const seccion of secciones) {
  for (let i = 1; i <= 3; i++) {
    const foto = await imagen(
      `portfolio-${seccion}-${i}`,
      `${seccion} ${i}`,
      i % 2 === 0 ? PALETA.arena : PALETA.crema,
      1000,
      1250,
    );

    await crear('portfolio', {
      seccion,
      titulo: '',
      imagen: foto,
      orden: ordenPortfolio++,
      activo: true,
    });
  }
}

console.log(`  ✓ ${secciones.length * 3} imágenes de portfolio`);

// --- Preguntas frecuentes ---
const faqs = [
  { categoria: 'Talleres', pregunta: '¿Hace falta saber algo antes de venir?',
    respuesta: '<p>No. Los talleres de iniciación empiezan desde cero y te acompañamos en todo el proceso.</p>' },
  { categoria: 'Talleres', pregunta: '¿Cómo reservo una plaza?',
    respuesta: '<p>Eliges la fecha en la web y rellenas el formulario. Te escribimos para confirmarte la plaza y decirte cómo pagar. <strong>La plaza no queda reservada hasta que te confirmemos.</strong></p>' },
  { categoria: 'Talleres', pregunta: '¿Y si al final no puedo ir?',
    respuesta: '<p>Avísanos con tiempo y buscamos otra fecha o le ofrecemos la plaza a otra persona.</p>' },
  { categoria: 'Bodas', pregunta: '¿Con cuánta antelación hay que encargar la papelería?',
    respuesta: '<p>Para invitaciones, entre tres y cuatro meses antes de la boda. Para el resto, con un mes suele bastar.</p>' },
  { categoria: 'Bodas', pregunta: '¿Los precios de la web son definitivos?',
    respuesta: '<p>Son orientativos. El precio final depende de acabados, cantidad y plazos. Pídenos presupuesto y te damos una cifra cerrada.</p>' },
];

for (const [indice, faq] of faqs.entries()) {
  await crear('faqs', { ...faq, orden: indice, activa: true });
}

console.log(`  ✓ ${faqs.length} preguntas frecuentes`);

// --- Testimonios ---
const quotes = [
  { texto: 'Las invitaciones quedaron preciosas y el trato fue cercano de principio a fin. Nos entendieron a la primera.', autor: 'María y Asier', contexto: 'Boda · Mayo 2026' },
  { texto: 'Da gusto madrugar un sábado para pasar la mañana pintando. Ojalá saquen más fechas.', autor: 'Raquel L.', contexto: 'Taller de acuarela' },
  { texto: 'Encargamos toda la papelería y el resultado fue mejor de lo que imaginábamos.', autor: 'Mar y Rafa', contexto: 'Boda · Octubre 2025' },
];

for (const [indice, quote] of quotes.entries()) {
  await crear('quotes', { ...quote, orden: indice, activa: true });
}

console.log(`  ✓ ${quotes.length} testimonios`);

// --- Preguntas extra de los formularios ---
const preguntas = [
  { formulario: 'taller', etiqueta: '¿Has hecho algo parecido antes?', tipo: 'opciones', opciones: ['Nunca', 'Alguna vez', 'Con frecuencia'], obligatoria: false },
  { formulario: 'taller', etiqueta: '¿Alguna alergia o algo que debamos saber?', tipo: 'textarea', opciones: [], obligatoria: false },
  { formulario: 'papeleria', etiqueta: 'Fecha de la boda', tipo: 'texto', opciones: [], obligatoria: true },
  { formulario: 'papeleria', etiqueta: '¿Cuántas invitaciones necesitáis, aproximadamente?', tipo: 'texto', opciones: [], obligatoria: true },
  { formulario: 'papeleria', etiqueta: '¿Qué piezas os interesan?', tipo: 'textarea', opciones: [], obligatoria: false },
  { formulario: 'liveart', etiqueta: 'Fecha y lugar del evento', tipo: 'texto', opciones: [], obligatoria: true },
  { formulario: 'liveart', etiqueta: 'Número aproximado de invitados', tipo: 'texto', opciones: [], obligatoria: true },
  { formulario: 'encargo', etiqueta: '¿Qué te gustaría que pintáramos?', tipo: 'textarea', opciones: [], obligatoria: true },
];

for (const [indice, pregunta] of preguntas.entries()) {
  await crear('formQuestions', { ...pregunta, orden: indice, activa: true });
}

console.log(`  ✓ ${preguntas.length} preguntas de formulario`);

// --- Textos de las páginas ---
const paginas = {
  home: {
    heroAntetitulo: 'Estudio creativo · Sevilla',
    heroTitulo: 'Papel, acuarela\ny manos que crean',
    manifiestoAntetitulo: 'En Veta creemos que',
    manifiestoFrase: 'Lo que se hace despacio\nse queda para siempre',
    manifiestoTexto: 'Trabajamos con las manos, con tiempo y con materiales que envejecen bien. Cada encargo empieza con una conversación.',
    papeleriaTitulo: 'Papelería que cuenta vuestra historia',
    papeleriaTexto: 'Cada pieza se diseña a medida, con acuarela original y acabados cuidados. Pídenos presupuesto sin compromiso.',
    liveartTitulo: 'Acuarelas en directo',
    liveartTexto: 'Una ilustradora retratando a tus invitados durante la celebración. Cada uno se lleva su acuarela a casa.',
    cierreTitulo: 'Nos vemos en el estudio',
    cierreTexto: 'Escríbenos y te contamos disponibilidad, precios y todo lo que necesites saber.',
  },
  'quienes-somos': {
    entradilla: 'Carmen y Maripepi, dos diseñadoras que trabajan el papel y la acuarela desde Sevilla.',
    queEsTitulo: 'Qué es Veta',
    queEsTexto: '<p>Veta es un estudio pequeño en Sevilla donde se diseña papelería de bodas, se pintan acuarelas por encargo y se dan talleres presenciales.</p><p>La veta es la marca que deja el tiempo en la madera y en la piedra. Nos gustó como nombre porque resume lo que hacemos: cosas con huella, hechas despacio.</p>',
    quienesTitulo: 'Carmen y Maripepi',
    quienesTexto: '<p>Texto pendiente de escribir. Aquí irá quiénes sois, de dónde venís y por qué montasteis el estudio.</p>',
  },
  talleres: {
    entradilla: 'Cerámica, pintura e infantil. Sesiones con plazas limitadas en nuestro estudio.',
    texto: '<p>Los talleres son en grupos pequeños, en nuestro estudio de Sevilla. Los materiales están incluidos y no hace falta traer nada.</p>',
    comoReservar: '<p>Elige una fecha, rellena el formulario y te escribimos para confirmarte la plaza. El pago se hace en el estudio o por Bizum, una vez confirmada.</p>',
  },
};

for (const [slug, textos] of Object.entries(paginas)) {
  await crearConId(`pages/${slug}`, { textos });
}

console.log(`  ✓ textos de ${Object.keys(paginas).length} páginas`);

// --- Registro, para poder deshacerlo ---
const previo = await leerRegistro(db);

await guardarRegistro(db, {
  documentos: [...previo.documentos, ...documentos],
  archivos: [...previo.archivos, ...archivos],
});

console.log(`\n  Listo: ${documentos.length} documentos y ${archivos.length} imágenes.`);
console.log('  Para quitarlo todo:  npm run ejemplo:borrar\n');
