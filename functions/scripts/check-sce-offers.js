#!/usr/bin/env node
/**
 * Prueba (SOLO LECTURA): cruza los recursos 'Disponible' del buscador del SCE
 * (links con ?cod_buscar=XXXXXX) con las ofertas que el SCE tiene publicadas hoy.
 *
 * Hace lo mismo que el navegador: carga la página pública del buscador, toma el
 * token que esa página entrega a cualquier visitante y llama a la API de ofertas
 * en difusión. Una sola petición a cada sitio. No escribe nada en Firestore.
 *
 * Uso (desde enredaAdmin/functions):
 *   GOOGLE_APPLICATION_CREDENTIALS=~/.config/firebase/<cred>.json \
 *     node scripts/check-sce-offers.js [--out sce-check.csv]
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const USER_AGENT = 'Mozilla/5.0 (compatible; EnredaLinkChecker/1.0)';
const PAGE_URL = 'https://www.gobiernodecanarias.org/empleo/sce/principal/componentes/buscadores_angular/index_ofertas_empleo.jsp?Title_prop=null&cod_buscar=null';
// La web del buscador llama a la API en www3 (rc_url_base en su bundle), no en www.
const API_URL = 'https://www3.gobiernodecanarias.org/empleo/SERELE-Inter/api/v2.0/ofertas/difusion?plataformaCliente=LGOPTIMUSL5%3A%3AAPPMOVIL%3A%3AANDROID-2.1%3A%3AV2.0';
const i = process.argv.indexOf('--out');
const OUT = path.resolve(i > 0 ? process.argv[i + 1] : `sce-check-${new Date().toISOString().slice(0, 10)}.csv`);

const csv = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

(async () => {
  // 1. Ofertas publicadas hoy en el SCE
  let t0 = Date.now();
  console.log('1/3 Cargando la página del buscador...');
  let page;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(PAGE_URL, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(45000) });
      page = await r.text();
      break;
    } catch (e) {
      console.log(`    Intento ${attempt} fallido (${e.cause?.code || e.name}) tras ${Math.round((Date.now() - t0) / 1000)} s`);
      if (attempt === 3) throw new Error('La página del buscador no responde. Prueba: curl -I "' + PAGE_URL + '"');
    }
  }
  const token = (page.match(/<sce-buscadores[^>]*\btoken="([^"]+)"/) || [])[1];
  if (!token) throw new Error('No se encontró el token en la página del buscador');
  console.log(`    OK (${Date.now() - t0} ms)`);

  // Mismas cabeceras que envía el navegador al hacer la llamada desde la web (www -> www3).
  t0 = Date.now();
  console.log('2/3 Llamando a la API de ofertas en difusión (puede tardar)...');
  let res;
  try {
    res = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': USER_AGENT,
        Accept: 'application/json, text/plain, */*',
        Origin: 'https://www.gobiernodecanarias.org',
        Referer: 'https://www.gobiernodecanarias.org/',
      },
      signal: AbortSignal.timeout(180000),
    });
  } catch (e) {
    throw new Error(`La API no respondió tras ${Math.round((Date.now() - t0) / 1000)} s (${e.cause?.code || e.name})`);
  }
  console.log(`    Cabeceras recibidas: HTTP ${res.status} (${Date.now() - t0} ms), leyendo cuerpo...`);
  const text = await res.text();
  console.log(`    Cuerpo: ${Math.round(text.length / 1024)} KB (${Date.now() - t0} ms)`);
  let body;
  try { body = JSON.parse(text); } catch { throw new Error(`Respuesta no JSON: ${text.slice(0, 300)}`); }
  if (!res.ok) throw new Error(`API ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  console.log('3/3 Cruzando con Firestore...');
  const offers = body?.data?.ofertasDifusion || [];
  console.log(`Ofertas publicadas en el SCE: ${offers.length}`);
  if (!offers.length) return;
  console.log('Campos de una oferta:', Object.keys(offers[0]).join(', '));
  console.log('Ejemplo:', JSON.stringify(offers[0]).slice(0, 600));

  // ?cod_buscar= solo lleva codigoSecuenciaOferta (6 dígitos), sin el año. La
  // secuencia se reinicia cada año, así que el mismo número puede ser otra oferta
  // de otro año: se exige además que el año de publicación cuadre con createdate.
  const live = new Map(); // secuencia -> [{ year, fecha }]
  for (const o of offers) {
    const seq = String(o.codigoSecuenciaOferta || '').trim();
    if (!seq) continue;
    const list = live.get(seq) || [];
    list.push({ year: parseInt(o.codigoAnioOferta, 10), fecha: o.fechaPublicacion || '' });
    live.set(seq, list);
  }
  console.log(`Códigos de oferta distintos detectados: ${live.size}`);

  // 2. Recursos activos de Enreda que apuntan al buscador del SCE
  admin.initializeApp({ projectId: 'enreda-d3b41' });
  const snap = await admin.firestore().collection('resources')
    .where('status', '==', 'Disponible').select('title', 'link', 'createdate').get();

  const rows = [];
  let generic = 0;
  for (const d of snap.docs) {
    const link = (d.get('link') || '').trim();
    if (!link.includes('gobiernodecanarias.org')) continue;
    const code = (link.match(/cod_buscar=(\d+)/) || [])[1];
    if (!code) { generic++; continue; }
    const created = d.get('createdate')?.toDate();
    const createYear = created ? created.getFullYear() : null;
    // El scraper crea el recurso después de publicarse la oferta: mismo año o el anterior.
    const match = (live.get(code) || []).find((o) => createYear && (o.year === createYear || o.year === createYear - 1));
    const reused = !match && live.has(code);
    rows.push({
      id: d.id, code,
      verdict: match ? 'PUBLICADA' : 'NO_PUBLICADA',
      fechaPublicacion: match?.fecha || (reused ? `(nº reutilizado por oferta de ${live.get(code)[0].year})` : ''),
      title: d.get('title') || '',
      createdate: created ? created.toISOString().slice(0, 10) : '', link,
    });
  }

  const counts = rows.reduce((a, r) => ((a[r.verdict] = (a[r.verdict] || 0) + 1), a), {});
  console.log('\nRecursos SCE con código de oferta:'); console.table(counts);
  console.log(`Recursos SCE con link genérico (sin cod_buscar): ${generic}`);

  // Sanity check: las publicadas deberían ser sobre todo las recientes.
  const byAge = {};
  for (const r of rows) {
    const days = (Date.now() - new Date(r.createdate)) / 864e5;
    const k = days < 30 ? '<30d' : days < 90 ? '30-90d' : days < 365 ? '90d-1a' : '>1a';
    byAge[k] = byAge[k] || { PUBLICADA: 0, NO_PUBLICADA: 0 };
    byAge[k][r.verdict]++;
  }
  console.log('Por antigüedad en Enreda:'); console.table(byAge);

  const header = ['resourceId', 'cod_buscar', 'verdict', 'fechaPublicacionSCE', 'title', 'createdate', 'link'];
  fs.writeFileSync(OUT, '﻿' + [header.join(','), ...rows
    .sort((a, b) => a.verdict.localeCompare(b.verdict) || a.createdate.localeCompare(b.createdate))
    .map((r) => [r.id, r.code, r.verdict, r.fechaPublicacion, r.title, r.createdate, r.link].map(csv).join(','))].join('\n'));
  console.log(`\nInforme: ${OUT}`);
  process.exit(0);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
