#!/usr/bin/env node
/**
 * Auditoría de links de recursos activos (status == 'Disponible').
 *
 * SOLO LECTURA: no escribe nada en Firestore. Genera un CSV con un veredicto
 * por recurso para revisarlo antes de desactivar nada.
 *
 * Veredictos:
 *   ROTO            -> 404/410, dominio inexistente, conexión rechazada o
 *                      página "no encontrada" (soft-404). Candidato a desactivar.
 *   DUDOSO          -> 401/403/429/5xx, timeouts, errores TLS, redirección a la
 *                      home... Revisar a mano, NO desactivar automáticamente.
 *   NO_VERIFICABLE  -> El link responde siempre igual (buscador genérico o SPA),
 *                      así que el código HTTP no dice nada de la oferta concreta.
 *   SIN_LINK / LINK_INVALIDO
 *   OK
 *
 * Uso (desde enredaAdmin/functions):
 *   GOOGLE_APPLICATION_CREDENTIALS=~/.config/firebase/<cred>.json \
 *     node scripts/audit-resource-links.js [--out informe.csv] [--limit 200]
 *       [--host ipetalavera.es] [--host-concurrency 2] [--concurrency 24]
 *       [--timeout 20000]
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// ---------- CLI ----------
const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : def;
};
const today = new Date().toISOString().slice(0, 10);
const OUT = path.resolve(arg('out', `link-audit-${today}.csv`));
const LIMIT = parseInt(arg('limit', '0'), 10) || 0;
const HOST_FILTER = arg('host', null);
const HOST_CONCURRENCY = parseInt(arg('host-concurrency', '2'), 10);
const GLOBAL_CONCURRENCY = parseInt(arg('concurrency', '24'), 10);
const TIMEOUT_MS = parseInt(arg('timeout', '20000'), 10);
const RETRIES = 2;
const MAX_BODY_BYTES = 256 * 1024;
const USER_AGENT = 'Mozilla/5.0 (compatible; EnredaLinkChecker/1.0)';

// ---------- Reglas por dominio ----------
// Links que devuelven la misma página genérica para cualquier oferta: el código
// HTTP no sirve para saber si la oferta sigue viva. No se piden.
const UNVERIFIABLE_RULES = [
  {
    test: (u) => u.hostname.endsWith('gobiernodecanarias.org') && u.pathname.includes('buscador_ofertas_empleo'),
    reason: 'Buscador SCE genérico (cod_buscar); la oferta no se puede comprobar por HTTP',
  },
  {
    test: (u) => u.hostname.endsWith('gobiernodecanarias.org') && u.pathname.includes('acciones_de_la_red_de_empleabilidad_canaria'),
    reason: 'Página genérica de la Red de Empleabilidad; no hay link específico',
  },
  {
    test: (u) => u.hostname.endsWith('gestionandote.com'),
    reason: 'SPA: devuelve la misma página vacía para cualquier oferta',
  },
];

const SOFT_404_TITLE = /(p[aá]gina no encontrada|no se ha encontrado|not found|page not found|error 404|\b404\b|no existe)/i;

const DEFINITELY_BROKEN_CODES = new Set(['ENOTFOUND', 'ECONNREFUSED']);
const TRANSIENT_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET', 'TimeoutError', 'AbortError']);

// ---------- Utilidades ----------
function normalizeLink(raw) {
  const s = (raw || '').toString().trim();
  if (!s || s === '-' || s === '.') return { error: 'SIN_LINK' };
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes('.')) return { error: 'LINK_INVALIDO' };
    return { url: u };
  } catch {
    return { error: 'LINK_INVALIDO' };
  }
}

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

function errorCode(e) {
  return e?.cause?.code || e?.code || e?.name || 'ERROR';
}

async function fetchOnce(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language': 'es-ES,es;q=0.9' },
  });
  const isHtml = (res.headers.get('content-type') || '').includes('html');
  const body = isHtml ? await readBodyLimited(res) : (res.body?.cancel().catch(() => {}), '');
  const title = ((body.match(/<title[^>]*>([^<]*)/i) || [])[1] || '').replace(/\s+/g, ' ').trim();
  return { status: res.status, finalUrl: res.url, title };
}

function classify(original, r) {
  const { status, finalUrl, title } = r;
  if (status === 404 || status === 410) return ['ROTO', `HTTP ${status}`];
  if (status >= 200 && status < 300) {
    if (SOFT_404_TITLE.test(title)) return ['ROTO', `Soft-404 (title: "${title.slice(0, 80)}")`];
    try {
      const f = new URL(finalUrl);
      const deep = original.pathname.replace(/\/+$/, '') !== '';
      if (deep && (f.pathname === '/' || f.pathname === '') && f.pathname !== original.pathname) {
        return ['DUDOSO', `Redirige a la home (${finalUrl})`];
      }
    } catch {}
    return ['OK', `HTTP ${status}`];
  }
  if ([401, 403, 429].includes(status)) return ['DUDOSO', `HTTP ${status} (posible bloqueo anti-bots)`];
  if (status >= 500) return ['DUDOSO', `HTTP ${status}`];
  return ['DUDOSO', `HTTP ${status}`];
}

async function checkUrl(u) {
  let lastErr = null;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const r = await fetchOnce(u.href);
      const [verdict, reason] = classify(u, r);
      // Reintentar 5xx/429 por si es algo puntual.
      if (verdict === 'DUDOSO' && (r.status >= 500 || r.status === 429) && attempt < RETRIES) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      return { verdict, reason, httpStatus: r.status, finalUrl: r.finalUrl, title: r.title };
    } catch (e) {
      lastErr = e;
      const code = errorCode(e);
      if (code === 'ENOTFOUND') break; // DNS definitivo, no reintentar
      if (attempt < RETRIES) await sleep(2000 * (attempt + 1));
    }
  }
  const code = errorCode(lastErr);
  if (DEFINITELY_BROKEN_CODES.has(code)) {
    return { verdict: 'ROTO', reason: code === 'ENOTFOUND' ? 'El dominio no existe (DNS)' : 'Conexión rechazada', httpStatus: '', finalUrl: '', title: '' };
  }
  const label = TRANSIENT_CODES.has(code) ? 'Timeout / error de red' : 'Error de conexión';
  return { verdict: 'DUDOSO', reason: `${label} (${code})`, httpStatus: '', finalUrl: '', title: '' };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Cola con límite global y por host.
function makeScheduler(globalLimit, perHostLimit) {
  let active = 0;
  const perHost = new Map();
  const queue = [];
  const pump = () => {
    for (let i = 0; i < queue.length && active < globalLimit; ) {
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

const csvCell = (v) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// ---------- Main ----------
(async () => {
  admin.initializeApp({ projectId: 'enreda-d3b41' });
  const db = admin.firestore();

  console.log('Leyendo recursos con status == Disponible...');
  const snap = await db.collection('resources')
    .where('status', '==', 'Disponible')
    .select('title', 'link', 'organizerName', 'createdby', 'createdate')
    .get();

  let docs = snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      title: x.title || '',
      link: x.link || '',
      organizer: x.organizerName || '',
      createdby: x.createdby || '',
      createdate: x.createdate?.toDate ? x.createdate.toDate().toISOString().slice(0, 10) : '',
    };
  });
  if (HOST_FILTER) docs = docs.filter((d) => normalizeLink(d.link).url?.hostname.includes(HOST_FILTER));
  if (LIMIT) docs = docs.slice(0, LIMIT);
  console.log(`Recursos a auditar: ${docs.length}`);

  // Clasificación previa y deduplicado de URLs.
  const byUrl = new Map(); // href -> { url, docs: [] }
  const results = new Map(); // doc.id -> result
  for (const d of docs) {
    const n = normalizeLink(d.link);
    if (n.error) {
      results.set(d.id, { verdict: n.error, reason: n.error === 'SIN_LINK' ? 'Sin link' : 'Link mal formado' });
      continue;
    }
    const rule = UNVERIFIABLE_RULES.find((r) => r.test(n.url));
    if (rule) {
      results.set(d.id, { verdict: 'NO_VERIFICABLE', reason: rule.reason });
      continue;
    }
    d.host = n.url.hostname;
    const entry = byUrl.get(n.url.href) || { url: n.url, docs: [] };
    entry.docs.push(d);
    byUrl.set(n.url.href, entry);
  }

  console.log(`URLs únicas a comprobar: ${byUrl.size}`);
  const schedule = makeScheduler(GLOBAL_CONCURRENCY, HOST_CONCURRENCY);
  let done = 0;
  const started = Date.now();
  await Promise.all([...byUrl.values()].map((entry) =>
    schedule(entry.url.hostname, () => checkUrl(entry.url)).then((r) => {
      for (const d of entry.docs) results.set(d.id, r);
      done++;
      if (done % 250 === 0 || done === byUrl.size) {
        const secs = Math.round((Date.now() - started) / 1000);
        console.log(`  ${done}/${byUrl.size} URLs (${secs}s)`);
      }
    })
  ));

  // CSV
  const header = ['resourceId', 'verdict', 'reason', 'httpStatus', 'host', 'link', 'finalUrl', 'pageTitle', 'title', 'organizer', 'createdby', 'createdate'];
  const lines = [header.join(',')];
  const order = { ROTO: 0, DUDOSO: 1, LINK_INVALIDO: 2, SIN_LINK: 3, NO_VERIFICABLE: 4, OK: 5 };
  const rows = docs.map((d) => ({ d, r: results.get(d.id) }))
    .sort((a, b) => (order[a.r.verdict] - order[b.r.verdict]) || (a.d.host || '').localeCompare(b.d.host || ''));
  for (const { d, r } of rows) {
    lines.push([
      d.id, r.verdict, r.reason, r.httpStatus, normalizeLink(d.link).url?.hostname || '', d.link,
      r.finalUrl, r.title, d.title, d.organizer, d.createdby, d.createdate,
    ].map(csvCell).join(','));
  }
  fs.writeFileSync(OUT, '﻿' + lines.join('\n'), 'utf8'); // BOM para que Excel lea bien los acentos

  // Resumen
  const byVerdict = {};
  const byHostBroken = {};
  for (const { d, r } of rows) {
    byVerdict[r.verdict] = (byVerdict[r.verdict] || 0) + 1;
    if (r.verdict === 'ROTO' || r.verdict === 'DUDOSO') {
      const h = normalizeLink(d.link).url?.hostname || '?';
      byHostBroken[h] = byHostBroken[h] || { ROTO: 0, DUDOSO: 0 };
      byHostBroken[h][r.verdict]++;
    }
  }
  console.log('\nResumen por veredicto:');
  console.table(byVerdict);
  console.log('ROTO/DUDOSO por dominio (top 25):');
  console.table(Object.fromEntries(Object.entries(byHostBroken).sort((a, b) => (b[1].ROTO + b[1].DUDOSO) - (a[1].ROTO + a[1].DUDOSO)).slice(0, 25)));
  console.log(`\nInforme: ${OUT}`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
