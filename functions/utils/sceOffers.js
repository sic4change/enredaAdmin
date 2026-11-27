/**
 * Ofertas publicadas hoy en el buscador del SCE (Servicio Canario de Empleo).
 *
 * La usan checkResourceDate (update/updateCountryOnly.js) y scripts/deactivate-stale-resources.js:
 * carga la página pública del buscador, toma el token que esa página entrega a cualquier
 * visitante y llama a la API de ofertas en difusión (la misma que usa el buscador).
 *
 * Los enlaces de los recursos del SCE son el buscador genérico con ?cod_buscar=NNNNNN, así que
 * el enlace en sí no dice nada: hay que cruzar ese código con las ofertas publicadas.
 */

const { USER_AGENT } = require('./linkChecker');

const SCE_PAGE_URL = 'https://www.gobiernodecanarias.org/empleo/sce/principal/componentes/buscadores_angular/index_ofertas_empleo.jsp?Title_prop=null&cod_buscar=null';
// La web del buscador llama a la API en www3 (rc_url_base en su bundle), no en www.
const SCE_API_URL = 'https://www3.gobiernodecanarias.org/empleo/SERELE-Inter/api/v2.0/ofertas/difusion?plataformaCliente=LGOPTIMUSL5%3A%3AAPPMOVIL%3A%3AANDROID-2.1%3A%3AV2.0';
// Si la API devuelve menos ofertas que esto, se considera un fallo y no se desactiva nada.
const MIN_SCE_OFFERS = 30;
const PAGE_TIMEOUT_MS = 45000;

// El SCE numera las ofertas con una secuencia que se reinicia cada año.
const normCode = (v) => {
  const n = parseInt(String(v ?? '').trim(), 10);
  return Number.isFinite(n) ? String(n) : null;
};

/** Código de oferta del enlace (?cod_buscar=006679 -> "6679"), o null si no lo tiene. */
const sceCode = (link) => normCode(((link || '').match(/cod_buscar=(\d+)/) || [])[1]);

const remaining = (deadline) => Math.max(1000, deadline - Date.now());
const seconds = (since) => Math.round((Date.now() - since) / 1000);

/**
 * Descarga las ofertas publicadas hoy. Lanza un error si algo falla (página, token, API o
 * respuesta sospechosa); en ese caso no se debe desactivar ningún recurso del SCE.
 * @param {object} options
 * @param {number} options.deadline      instante (ms) a partir del cual se abandona la descarga.
 * @param {number} [options.minOffers]   mínimo de ofertas para dar la respuesta por buena.
 * @param {number} [options.pageAttempts] intentos para cargar la página del buscador.
 * @param {(msg: string) => void} [options.log] progreso (los scripts lo muestran por consola).
 * @returns {Promise<{ live: Map<string, {year: number, fecha: string}[]>, total: number }>}
 */
async function fetchSceOffers({ deadline, minOffers = MIN_SCE_OFFERS, pageAttempts = 2, log = () => {} }) {
  // 1. Página del buscador, para sacar el token.
  let t0 = Date.now();
  log('SCE 1/2: cargando la página del buscador...');
  let page;
  let lastError = 'sin tiempo';
  for (let attempt = 1; attempt <= pageAttempts && !page && Date.now() < deadline; attempt++) {
    try {
      const r = await fetch(SCE_PAGE_URL, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(Math.min(PAGE_TIMEOUT_MS, remaining(deadline))),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      page = await r.text();
    } catch (e) {
      lastError = e?.cause?.code || e?.message || e?.name;
      log(`    Intento ${attempt} fallido (${lastError}) tras ${seconds(t0)} s`);
    }
  }
  if (!page) throw new Error(`La página del buscador del SCE no responde (${lastError})`);
  const token = (page.match(/<sce-buscadores[^>]*\btoken="([^"]+)"/) || [])[1];
  if (!token) throw new Error('No se encontró el token en la página del buscador del SCE (¿ha cambiado la web?)');

  // 2. API de ofertas en difusión (puede tardar 2-3 minutos).
  t0 = Date.now();
  log('SCE 2/2: descargando las ofertas publicadas (puede tardar hasta 2-3 min)...');
  const res = await fetch(SCE_API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': USER_AGENT,
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://www.gobiernodecanarias.org',
      Referer: 'https://www.gobiernodecanarias.org/',
    },
    signal: AbortSignal.timeout(remaining(deadline)),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`La API del SCE respondió HTTP ${res.status}: ${text.slice(0, 200)}`);
  let body;
  try { body = JSON.parse(text); } catch { throw new Error(`La API del SCE no devolvió JSON: ${text.slice(0, 200)}`); }
  const offers = body?.data?.ofertasDifusion;
  if (!Array.isArray(offers)) throw new Error('Formato inesperado en la respuesta del SCE (falta data.ofertasDifusion)');
  if (offers.length < minOffers) {
    throw new Error(`El SCE solo devolvió ${offers.length} ofertas (mínimo esperado ${minOffers}); parece un fallo de la API`);
  }

  const live = new Map(); // código -> [{ year, fecha }]
  for (const o of offers) {
    const code = normCode(o.codigoSecuenciaOferta);
    if (!code) continue;
    const list = live.get(code) || [];
    list.push({ year: parseInt(o.codigoAnioOferta, 10), fecha: o.fechaPublicacion || '' });
    live.set(code, list);
  }
  log(`    ${offers.length} ofertas publicadas hoy en el SCE (${seconds(t0)} s)`);
  return { live, total: offers.length };
}

/**
 * ¿Sigue publicada la oferta? Como el código se reinicia cada año, se empareja también el año:
 * el recurso se da de alta después de publicarse la oferta, así que mismo año o el anterior.
 * @returns {{ published: boolean, reason: string }}
 */
function checkSceOffer(live, code, createdYear) {
  const hits = live.get(code) || [];
  const match = hits.find((o) => o.year === createdYear || o.year === createdYear - 1);
  if (match) return { published: true, reason: `Publicada en el SCE (${match.fecha})` };
  return {
    published: false,
    reason: hits.length ? `No publicada en el SCE (el nº ${code} es ahora una oferta de ${hits[0].year})` : 'No publicada en el SCE',
  };
}

module.exports = { sceCode, fetchSceOffers, checkSceOffer };
