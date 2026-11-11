import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions';

import { REGION, exigirAdmin } from './comun.js';

/**
 * Las visitas de la web, traídas de Cloudflare Web Analytics.
 *
 * Va en una Function y no en el panel por una razón concreta: el token de
 * Cloudflare da acceso de lectura a toda la cuenta, y cualquier cosa que viaje
 * al navegador se puede leer desde las herramientas del desarrollador. Aquí
 * vive en Secret Manager y nunca sale del servidor.
 *
 * Pasos para crear el token y averiguar el identificador del sitio, en
 * `DESPLIEGUE.md` § Estadísticas de la web.
 */

const CLOUDFLARE_API_TOKEN = defineSecret('CLOUDFLARE_API_TOKEN');

const CLOUDFLARE_ACCOUNT_TAG = defineString('CLOUDFLARE_ACCOUNT_TAG', { default: '' });
const CLOUDFLARE_SITE_TAG = defineString('CLOUDFLARE_SITE_TAG', { default: '' });

const ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

/** Cloudflare no guarda más atrás que esto en el plan gratuito. */
const DIAS_MAXIMOS = 365;

const CONSULTA = `
  query Visitas($cuenta: String!, $sitio: String!, $desde: Date!, $hasta: Date!) {
    viewer {
      accounts(filter: { accountTag: $cuenta }) {
        porDia: rumPageloadEventsAdaptiveGroups(
          filter: { siteTag: $sitio, date_geq: $desde, date_leq: $hasta, bot: 0 }
          limit: 400
          orderBy: [date_ASC]
        ) {
          count
          sum { visits }
          dimensions { date }
        }
        paginas: rumPageloadEventsAdaptiveGroups(
          filter: { siteTag: $sitio, date_geq: $desde, date_leq: $hasta, bot: 0 }
          limit: 15
          orderBy: [count_DESC]
        ) {
          count
          dimensions { requestPath }
        }
        origenes: rumPageloadEventsAdaptiveGroups(
          filter: { siteTag: $sitio, date_geq: $desde, date_leq: $hasta, bot: 0 }
          limit: 10
          orderBy: [count_DESC]
        ) {
          count
          dimensions { refererHost }
        }
      }
    }
  }
`;

/**
 * Qué sitios ve este token, con sus identificadores.
 *
 * Existe porque el `siteTag` es el dato que más se presta a confusión: la
 * documentación de terceros no se pone de acuerdo sobre si es el token del
 * beacon o un valor distinto. En vez de adivinar, se le pregunta a la propia
 * API, y el panel enseña la lista. Convierte «salen ceros y no sé por qué» en
 * «pega este identificador».
 */
const DESCUBRIR = `
  query Sitios($cuenta: String!, $desde: Date!, $hasta: Date!) {
    viewer {
      accounts(filter: { accountTag: $cuenta }) {
        sitios: rumPageloadEventsAdaptiveGroups(
          filter: { date_geq: $desde, date_leq: $hasta }
          limit: 20
          orderBy: [count_DESC]
        ) {
          count
          dimensions { siteTag }
        }
      }
    }
  }
`;

interface Grupo {
  count: number;
  sum?: { visits: number };
  dimensions: { date?: string; requestPath?: string; refererHost?: string; siteTag?: string };
}

interface Respuesta<T> {
  data?: { viewer?: { accounts?: T[] } };
  errors?: { message: string }[];
}

type Visitas = { porDia: Grupo[]; paginas: Grupo[]; origenes: Grupo[] };
type Sitios = { sitios: Grupo[] };

function soloFecha(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new HttpsError('invalid-argument', `La fecha de ${campo} no es válida.`);
  }

  return valor;
}

async function preguntar<T>(
  token: string,
  query: string,
  variables: Record<string, string>,
): Promise<T[]> {
  let respuesta: Response;

  try {
    respuesta = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
  } catch (e) {
    logger.error('No se pudo contactar con Cloudflare', e);
    throw new HttpsError('unavailable', 'No hemos podido contactar con Cloudflare.');
  }

  if (!respuesta.ok) {
    logger.error('Cloudflare respondió con error', { estado: respuesta.status });
    throw new HttpsError(
      'unavailable',
      respuesta.status === 401 || respuesta.status === 403
        ? 'Cloudflare ha rechazado el token. Comprueba que sigue siendo válido y que tiene permiso de lectura de analítica de cuenta.'
        : 'Cloudflare no ha respondido bien. Inténtalo más tarde.',
    );
  }

  const cuerpo = (await respuesta.json()) as Respuesta<T>;

  // GraphQL devuelve 200 aunque la consulta falle: el error va en el cuerpo.
  if (cuerpo.errors?.length) {
    logger.error('Cloudflare devolvió errores de GraphQL', cuerpo.errors);
    throw new HttpsError('internal', cuerpo.errors[0]?.message ?? 'Consulta rechazada.');
  }

  return cuerpo.data?.viewer?.accounts ?? [];
}

/** Los identificadores de sitio que alcanza este token, de más a menos tráfico. */
async function sitiosVisibles(token: string, cuenta: string, hasta: string): Promise<string[]> {
  const desde = new Date(Date.parse(hasta) - 30 * 86_400_000).toISOString().slice(0, 10);

  try {
    const cuentas = await preguntar<Sitios>(token, DESCUBRIR, { cuenta, desde, hasta });

    return (cuentas[0]?.sitios ?? [])
      .map((g) => g.dimensions.siteTag ?? '')
      .filter((tag) => tag.length > 0);
  } catch {
    // Es una ayuda para configurar, no la función principal: si falla, calla.
    return [];
  }
}

export const estadisticasWeb = onCall<{ desde: string; hasta: string }>(
  { region: REGION, secrets: [CLOUDFLARE_API_TOKEN] },
  async (peticion) => {
    exigirAdmin(peticion);

    const cuenta = CLOUDFLARE_ACCOUNT_TAG.value().trim();
    const sitio = CLOUDFLARE_SITE_TAG.value().trim();
    const token = CLOUDFLARE_API_TOKEN.value().trim();

    const desde = soloFecha(peticion.data?.desde, 'inicio');
    const hasta = soloFecha(peticion.data?.hasta, 'fin');

    // Sin configurar no es un error: es que todavía no se ha hecho ese paso. El
    // panel lo distingue de un fallo real y enseña las instrucciones.
    if (!cuenta || !token) {
      return { configurado: false, sitios: [], porDia: [], paginas: [], origenes: [] };
    }

    // Con cuenta y token pero sin sitio ya se le puede preguntar a Cloudflare
    // cuál es, en vez de obligar a adivinarlo.
    if (!sitio) {
      return {
        configurado: false,
        sitios: await sitiosVisibles(token, cuenta, hasta),
        porDia: [],
        paginas: [],
        origenes: [],
      };
    }

    if (desde > hasta) {
      throw new HttpsError('invalid-argument', 'La fecha de inicio es posterior a la de fin.');
    }

    const dias = (Date.parse(hasta) - Date.parse(desde)) / 86_400_000;

    if (dias > DIAS_MAXIMOS) {
      throw new HttpsError('invalid-argument', 'El periodo no puede pasar de un año.');
    }

    const cuentas = await preguntar<Visitas>(token, CONSULTA, { cuenta, sitio, desde, hasta });

    const datos = cuentas[0];

    if (!datos) {
      throw new HttpsError(
        'not-found',
        'Cloudflare no reconoce esa cuenta. Revisa el identificador de cuenta.',
      );
    }

    // El identificador puede ser válido como cadena y no corresponder a ningún
    // sitio: Cloudflare no se queja, simplemente devuelve cero filas. Cuando
    // pasa, se le pregunta cuáles conoce para poder decirlo en el panel.
    const sitios = datos.porDia.length === 0 ? await sitiosVisibles(token, cuenta, hasta) : [];

    return {
      configurado: true,
      sitios: sitios.filter((tag) => tag !== sitio),
      porDia: datos.porDia.map((g) => ({
        fecha: g.dimensions.date ?? '',
        paginasVistas: g.count,
        visitas: g.sum?.visits ?? 0,
      })),
      paginas: datos.paginas.map((g) => ({
        ruta: g.dimensions.requestPath ?? '',
        paginasVistas: g.count,
      })),
      origenes: datos.origenes.map((g) => ({
        origen: g.dimensions.refererHost ?? '',
        paginasVistas: g.count,
      })),
    };
  },
);
