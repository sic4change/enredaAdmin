/**
 * Comprobación HTTP de los enlaces de los recursos.
 *
 * La usan checkResourceDate (update/updateCountryOnly.js) y el script
 * scripts/deactivate-stale-resources.js. Los veredictos son:
 *   ROTO     404/410, soft-404 (título "página no encontrada"...) o dominio inexistente.
 *   DUDOSO   401/403/429/5xx, timeouts, conexión rechazada, redirección a la home... No se debe
 *            actuar sin revisar.
 *   OK
 * Además, `code` lleva el código de error de red cuando lo hay (ENOTFOUND, ECONNREFUSED...).
 */

const USER_AGENT = 'Mozilla/5.0 (compatible; EnredaLinkChecker/1.0)';
const MAX_BODY_BYTES = 256 * 1024;

const SOFT_404_TITLE = /(p[aá]gina no encontrada|no se ha encontrado|not found|page not found|error 404|\b404\b|no existe)/i;
const TRANSIENT_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET', 'TimeoutError', 'AbortError']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeLink(raw) {
  const s = (raw || '').toString().trim();
  if (!s || s === '-' || s === '.') return { error: 'SIN_LINK' };
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes('.')) return { error: 'LINK_INVALIDO' };
    return { url };
  } catch {
    return { error: 'LINK_INVALIDO' };
  }
}

const isHost = (url, domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`);

async function readBodyLimited(res) {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (size < MAX_BODY_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
}

// Solo códigos de texto: un timeout es un DOMException con code numérico (23) y name 'TimeoutError'.
const errorCode = (e) => e?.cause?.code || (typeof e?.code === 'string' && e.code) || e?.name || 'ERROR';

async function fetchOnce(url, timeoutMs) {
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language': 'es-ES,es;q=0.9' },
  });
  const isHtml = (res.headers.get('content-type') || '').includes('html');
  const body = isHtml ? await readBodyLimited(res) : (res.body?.cancel().catch(() => {}), '');
  const title = ((body.match(/<title[^>]*>([^<]*)/i) || [])[1] || '').replace(/\s+/g, ' ').trim();
  return { status: res.status, finalUrl: res.url, title };
}

/** Veredicto de una respuesta HTTP: [verdict, reason]. */
function classify(original, { status, finalUrl, title }) {
  if (status === 404 || status === 410) return ['ROTO', `HTTP ${status}`];
  if (status >= 200 && status < 300) {
    if (SOFT_404_TITLE.test(title)) return ['ROTO', `Soft-404 (title: "${title.slice(0, 80)}")`];
    try {
      const f = new URL(finalUrl);
      const deep = original.pathname.replace(/\/+$/, '') !== '';
      if (deep && (f.pathname === '/' || f.pathname === '')) return ['DUDOSO', `Redirige a la home (${finalUrl})`];
    } catch {}
    return ['OK', `HTTP ${status}`];
  }
  if ([401, 403, 429].includes(status)) return ['DUDOSO', `HTTP ${status} (posible bloqueo anti-bots)`];
  return ['DUDOSO', `HTTP ${status}`];
}

/**
 * Comprueba una URL (objeto URL) con reintentos.
 * @returns {Promise<{ verdict, reason, httpStatus, finalUrl, title, code }>}
 */
async function checkUrl(url, { timeoutMs = 15000, retries = 2 } = {}) {
  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetchOnce(url.href, timeoutMs);
      const [verdict, reason] = classify(url, r);
      // Reintentar 5xx/429 por si es algo puntual.
      if (verdict === 'DUDOSO' && (r.status >= 500 || r.status === 429) && attempt < retries) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      return { verdict, reason, httpStatus: r.status, finalUrl: r.finalUrl, title: r.title, code: null };
    } catch (e) {
      lastErr = e;
      if (errorCode(e) === 'ENOTFOUND') break; // DNS definitivo, no reintentar
      if (attempt < retries) await sleep(2000 * (attempt + 1));
    }
  }
  const code = errorCode(lastErr);
  const failed = { httpStatus: null, finalUrl: null, title: null, code };
  if (code === 'ENOTFOUND') return { verdict: 'ROTO', reason: 'El dominio no existe (DNS)', ...failed };
  // ECONNREFUSED es DUDOSO: puede ser un servidor caído un rato, no una oferta retirada.
  const label = code === 'ECONNREFUSED' ? 'Conexión rechazada' : TRANSIENT_CODES.has(code) ? 'Timeout / error de red' : 'Error de conexión';
  return { verdict: 'DUDOSO', reason: `${label} (${code})`, ...failed };
}

/** Cola con límite global y por host, para no saturar ninguna web. */
function makeScheduler(globalLimit, perHostLimit) {
  let active = 0;
  const perHost = new Map();
  const queue = [];
  const pump = () => {
    for (let i = 0; i < queue.length && active < globalLimit;) {
      const job = queue[i];
      const h = perHost.get(job.host) || 0;
      if (h >= perHostLimit) { i++; continue; }
      queue.splice(i, 1);
      active++;
      perHost.set(job.host, h + 1);
      job.fn().then(job.resolve, job.reject).finally(() => {
        active--;
        perHost.set(job.host, perHost.get(job.host) - 1);
        pump();
      });
    }
  };
  return (host, fn) => new Promise((resolve, reject) => { queue.push({ host, fn, resolve, reject }); pump(); });
}

module.exports = { USER_AGENT, sleep, normalizeLink, isHost, checkUrl, makeScheduler };
