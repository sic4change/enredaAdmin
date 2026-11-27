#!/usr/bin/env node
/**
 * Desactiva los recursos 'Disponible' que en realidad ya no lo están.
 *
 * Regla general, aplicada antes que ninguna otra: todo recurso con más de N días
 * desde el alta (--max-age-days, 60 por defecto) se desactiva, sea de la fuente
 * que sea. Solo los recientes pasan a los criterios por fuente, así se hacen
 * muchas menos peticiones:
 *   SCE_OFERTA      gobiernodecanarias.org con ?cod_buscar=NNN: se desactiva si la
 *                   oferta no figura entre las que el SCE tiene publicadas hoy
 *                   (emparejando también el año con la fecha de alta). El SCE
 *                   solo se consulta si hay ofertas recientes por cruzar.
 *   SCE_GENERICO    gobiernodecanarias.org sin código: se mantiene.
 *   IPETALAVERA     ipetalavera.es nunca retira ofertas: se mantiene.
 *   ENLACE          Resto de dominios: se comprueba el enlace; solo se desactivan
 *                   los ROTOS (404/410, dominio inexistente, soft-404). Los
 *                   dudosos (403, 5xx, timeouts, conexión rechazada...) quedan
 *                   para revisión manual.
 *   NO_VERIFICABLE  gestionandote.com: revisión manual.
 *   SIN_ENLACE      Sin enlace o mal formado: revisión manual.
 *   Sin fecha de alta: nunca se desactivan por antigüedad.
 *
 * Tres modos:
 *
 * 1) Simulación (por defecto). SOLO LECTURA. Genera:
 *      desactivacion-recursos-<fecha>.csv        todos los recursos con su decisión
 *      desactivacion-recursos-<fecha>.plan.json  solo los que se desactivarían
 *
 * 2) --apply <plan.json>. Desactiva exactamente los recursos del plan revisado
 *    (si se quiere excluir alguno, se borra del JSON). Cada recurso queda con
 *      status: 'No disponible', enable: false,
 *      deactivation: { runId, block, reason, at, previousEnable }
 *    Solo toca los que siguen en 'Disponible'. Antes desactiva uno de prueba y
 *    comprueba que el trigger updateResource no lo reactiva (fallo corregido en
 *    index.js que hay que tener desplegado).
 *
 * 3) --revert <plan.json>. Deshace lo aplicado con ese plan (solo los recursos
 *    cuyo deactivation.runId coincide y siguen 'No disponible').
 *
 * Uso (desde enredaAdmin/functions):
 *   export GOOGLE_APPLICATION_CREDENTIALS=~/.config/firebase/<cred>.json
 *   node scripts/deactivate-stale-resources.js [--max-age-days 60] [--out-dir .]
 *        [--skip-link-check] [--min-sce-offers 30]
 *   node scripts/deactivate-stale-resources.js --apply desactivacion-recursos-<fecha>.plan.json
 *   node scripts/deactivate-stale-resources.js --revert desactivacion-recursos-<fecha>.plan.json
 *   (--yes omite la confirmación interactiva)
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const admin = require('firebase-admin');
const { sleep, normalizeLink, isHost, checkUrl, makeScheduler } = require('../utils/linkChecker');
const { sceCode, fetchSceOffers, checkSceOffer } = require('../utils/sceOffers');

// ---------- CLI ----------
const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined && !args[i + 1].startsWith('--') ? args[i + 1] : def;
};
const flag = (name) => args.includes(`--${name}`);

const APPLY = arg('apply', null);
const REVERT = arg('revert', null);
const MAX_AGE_DAYS = parseInt(arg('max-age-days', '60'), 10);
const OUT_DIR = path.resolve(arg('out-dir', '.'));
const MIN_SCE_OFFERS = parseInt(arg('min-sce-offers', '30'), 10);
const SKIP_LINK_CHECK = flag('skip-link-check');
const YES = flag('yes');

const PROJECT_ID = 'enreda-d3b41';
const PLAN_MAX_AGE_DAYS = 3; // un plan más viejo se considera desfasado
const BATCH_SIZE = 200;
const CANARY_WAIT_MS = 30000;

const HOST_CONCURRENCY = 2;
const GLOBAL_CONCURRENCY = 24;
const TIMEOUT_MS = 20000;
const SCE_FETCH_TIMEOUT_MS = 6 * 60 * 1000;

// ---------- Decisión por recurso ----------
function blockOf(n, link) {
  if (n.error) return 'SIN_ENLACE';
  if (isHost(n.url, 'gobiernodecanarias.org')) return sceCode(link) ? 'SCE_OFERTA' : 'SCE_GENERICO';
  if (isHost(n.url, 'ipetalavera.es')) return 'IPETALAVERA';
  if (isHost(n.url, 'gestionandote.com')) return 'NO_VERIFICABLE';
  return 'ENLACE';
}

// sceLive === null significa "todavía no se ha consultado el SCE": los recursos que
// lo necesitan quedan como PENDIENTE_SCE y se deciden después.
function decide(row, created, sceLive) {
  const n = normalizeLink(row.link);
  if (n.url) row.host = n.url.hostname;
  const block = blockOf(n, row.link);

  // Regla general, antes que nada: cualquier recurso con más de N días desde el
  // alta se desactiva. Así se evitan las comprobaciones de enlaces de los antiguos.
  if (row.ageDays != null && row.ageDays > MAX_AGE_DAYS) {
    return { block, action: 'DESACTIVAR', reason: `${row.ageDays} días desde el alta (> ${MAX_AGE_DAYS})` };
  }
  const recent = row.ageDays == null ? 'sin fecha de alta' : `${row.ageDays} días desde el alta`;

  switch (block) {
    case 'SIN_ENLACE':
      return { block, action: 'REVISAR', reason: n.error === 'SIN_LINK' ? 'Sin enlace' : 'Enlace mal formado' };
    case 'SCE_GENERICO':
    case 'IPETALAVERA':
      // El enlace no dice nada: solo cuenta la antigüedad.
      return { block, action: row.ageDays == null ? 'REVISAR' : 'MANTENER', reason: recent };
    case 'NO_VERIFICABLE':
      return { block, action: 'REVISAR', reason: `SPA: el enlace no indica si la oferta sigue viva; ${recent}` };
    case 'ENLACE':
      if (SKIP_LINK_CHECK) return { block, action: 'REVISAR', reason: 'Comprobación de enlace omitida (--skip-link-check)' };
      return { block, action: 'COMPROBAR', url: n.url };
  }

  // SCE_OFERTA
  if (!created) return { block, action: 'REVISAR', reason: 'Sin fecha de alta para emparejar con el SCE' };
  if (!sceLive) return { block, action: 'PENDIENTE_SCE' };
  const { published, reason } = checkSceOffer(sceLive, sceCode(row.link), created.getFullYear());
  return { block, action: published ? 'MANTENER' : 'DESACTIVAR', reason };
}

// ---------- Modo simulación ----------
const csvCell = (v) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function buildPlan(db) {
  console.log('Leyendo recursos con status == Disponible...');
  const snap = await db.collection('resources')
    .where('status', '==', 'Disponible')
    .select('title', 'link', 'createdate', 'createdby', 'organizerName', 'start', 'end', 'participants')
    .get();
  console.log(`    ${snap.size} recursos disponibles`);

  const now = Date.now();
  const rows = [];
  const toCheck = new Map(); // href -> { url, rows: [] }
  for (const doc of snap.docs) {
    const x = doc.data();
    const created = x.createdate?.toDate ? x.createdate.toDate() : null;
    const row = {
      id: doc.id,
      title: x.title || '',
      link: (x.link || '').toString().trim(),
      organizer: x.organizerName || '',
      createdby: x.createdby || '',
      createdate: created ? created.toISOString().slice(0, 10) : '',
      ageDays: created ? Math.floor((now - created.getTime()) / 864e5) : null,
      // updateResourceEmail manda un push "Ha cambiado el recurso" a los participantes
      // si start/end no existen, aunque solo cambie el status.
      pushRisk: (!x.start || !x.end) && Array.isArray(x.participants) && x.participants.length > 0,
      host: '',
      httpStatus: '',
      finalUrl: '',
    };
    const { url, ...decision } = decide(row, created, null);
    Object.assign(row, decision);
    if (row.action === 'COMPROBAR') {
      const entry = toCheck.get(url.href) || { url, rows: [] };
      entry.rows.push(row);
      toCheck.set(url.href, entry);
    }
    row.created = created;
    rows.push(row);
  }
  const oldCount = rows.filter((r) => r.action === 'DESACTIVAR').length;
  console.log(`    ${oldCount} con más de ${MAX_AGE_DAYS} días se desactivan directamente, sin más comprobaciones`);

  // Solo se consulta el SCE si quedan ofertas recientes suyas por decidir.
  const pendingSce = rows.filter((r) => r.action === 'PENDIENTE_SCE');
  let sce = null;
  if (pendingSce.length) {
    console.log(`${pendingSce.length} ofertas recientes del SCE por cruzar`);
    sce = await fetchSceOffers({
      deadline: Date.now() + SCE_FETCH_TIMEOUT_MS,
      minOffers: MIN_SCE_OFFERS,
      pageAttempts: 3,
      log: console.log,
    });
    for (const r of pendingSce) Object.assign(r, decide(r, r.created, sce.live));
    // Si ninguna coincide con las ofertas publicadas, el cruce está roto.
    if (!pendingSce.some((r) => r.action === 'MANTENER')) {
      throw new Error('Ningún recurso reciente del SCE coincide con las ofertas publicadas: el cruce parece roto (¿ha cambiado el formato de los códigos?). No se genera plan.');
    }
  }
  const sceKept = pendingSce.filter((r) => r.action === 'MANTENER').length;

  if (toCheck.size) {
    console.log(`Comprobando ${toCheck.size} enlaces únicos del resto de dominios...`);
    const schedule = makeScheduler(GLOBAL_CONCURRENCY, HOST_CONCURRENCY);
    let done = 0;
    const t0 = Date.now();
    await Promise.all([...toCheck.values()].map((entry) =>
      schedule(entry.url.hostname, () => checkUrl(entry.url, { timeoutMs: TIMEOUT_MS })).then((r) => {
        const action = r.verdict === 'ROTO' ? 'DESACTIVAR' : r.verdict === 'DUDOSO' ? 'REVISAR' : 'MANTENER';
        for (const row of entry.rows) Object.assign(row, { action, reason: `Enlace ${r.verdict}: ${r.reason}`, httpStatus: r.httpStatus, finalUrl: r.finalUrl });
        done++;
        if (done % 100 === 0 || done === toCheck.size) console.log(`    ${done}/${toCheck.size} (${Math.round((Date.now() - t0) / 1000)} s)`);
      })
    ));
  }

  // ---- Salida ----
  const stamp = new Date().toISOString().slice(0, 16).replace(':', '-');
  const base = path.join(OUT_DIR, `desactivacion-recursos-${stamp}`);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const order = { DESACTIVAR: 0, REVISAR: 1, MANTENER: 2 };
  rows.sort((a, b) => (order[a.action] - order[b.action]) || a.block.localeCompare(b.block) || a.createdate.localeCompare(b.createdate));
  const header = ['resourceId', 'action', 'block', 'reason', 'ageDays', 'createdate', 'host', 'link', 'title', 'organizer', 'createdby', 'httpStatus', 'finalUrl', 'pushRisk'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([r.id, r.action, r.block, r.reason, r.ageDays, r.createdate, r.host, r.link, r.title, r.organizer, r.createdby, r.httpStatus, r.finalUrl, r.pushRisk ? 'SI' : ''].map(csvCell).join(','));
  }
  fs.writeFileSync(`${base}.csv`, '﻿' + lines.join('\n'), 'utf8');

  const items = rows.filter((r) => r.action === 'DESACTIVAR').map((r) => ({ id: r.id, block: r.block, reason: r.reason }));
  const plan = {
    runId: `cleanup-${stamp}`,
    createdAt: new Date().toISOString(),
    maxAgeDays: MAX_AGE_DAYS,
    sceOffersPublished: sce ? sce.total : null,
    totalAvailable: rows.length,
    items,
  };
  fs.writeFileSync(`${base}.plan.json`, JSON.stringify(plan, null, 2), 'utf8');

  // ---- Resumen ----
  const table = {};
  for (const r of rows) {
    table[r.block] = table[r.block] || { DESACTIVAR: 0, REVISAR: 0, MANTENER: 0 };
    table[r.block][r.action]++;
  }
  const totals = { DESACTIVAR: 0, REVISAR: 0, MANTENER: 0 };
  for (const t of Object.values(table)) for (const k of Object.keys(totals)) totals[k] += t[k];
  table.TOTAL = totals;

  console.log('\nResumen por bloque (SIMULACIÓN, no se ha escrito nada):');
  console.table(table);
  if (sce) console.log(`Ofertas publicadas hoy en el SCE: ${sce.total} · recursos recientes del SCE que siguen publicados: ${sceKept}`);
  const brokenHosts = {};
  for (const r of rows) if (r.block === 'ENLACE' && r.action === 'DESACTIVAR') brokenHosts[r.host] = (brokenHosts[r.host] || 0) + 1;
  if (Object.keys(brokenHosts).length) {
    console.log('Enlaces rotos por dominio (top 15):');
    console.table(Object.fromEntries(Object.entries(brokenHosts).sort((a, b) => b[1] - a[1]).slice(0, 15)));
  }
  const pushRisk = rows.filter((r) => r.action === 'DESACTIVAR' && r.pushRisk).length;
  if (pushRisk) {
    console.log(`⚠️  ${pushRisk} recursos a desactivar tienen participantes y no tienen start/end: el trigger updateResourceEmail les enviará un push "Ha cambiado el recurso" (columna pushRisk del CSV).`);
  }
  console.log(`\n${totals.DESACTIVAR} de ${rows.length} recursos disponibles pasarían a 'No disponible'.`);
  console.log(`Informe: ${base}.csv`);
  console.log(`Plan:    ${base}.plan.json`);
  console.log(`\nPara aplicarlo:\n  node scripts/deactivate-stale-resources.js --apply ${path.relative(process.cwd(), `${base}.plan.json`)}`);
}

// ---------- Modos apply / revert ----------
async function confirm(message) {
  if (YES) return;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`${message}\nEscribe SI para continuar: `);
  rl.close();
  if (answer.trim().toUpperCase() !== 'SI') throw new Error('Cancelado, no se ha modificado nada.');
}

async function processChunk(db, plan, items, mode) {
  const FieldValue = admin.firestore.FieldValue;
  const snaps = await db.getAll(...items.map((it) => db.collection('resources').doc(it.id)));
  const batch = db.batch();
  const stats = { updated: 0, skipped: 0, missing: 0, updatedIds: [] };
  snaps.forEach((s, k) => {
    const it = items[k];
    if (!s.exists) { stats.missing++; return; }
    const d = s.data();
    if (mode === 'apply') {
      if (d.status !== 'Disponible') { stats.skipped++; return; }
      batch.update(s.ref, {
        status: 'No disponible',
        enable: false,
        deactivation: {
          runId: plan.runId,
          block: it.block,
          reason: it.reason,
          at: FieldValue.serverTimestamp(),
          previousEnable: d.enable ?? null,
        },
      });
    } else {
      if (d.deactivation?.runId !== plan.runId || d.status !== 'No disponible') { stats.skipped++; return; }
      batch.update(s.ref, {
        status: 'Disponible',
        enable: d.deactivation.previousEnable ?? true,
        deactivation: FieldValue.delete(),
      });
    }
    stats.updated++;
    stats.updatedIds.push(it.id);
  });
  if (stats.updated) await batch.commit();
  return stats;
}

// Desactiva un recurso y espera a ver si el trigger updateResource lo reactiva.
async function canary(db, plan, items) {
  for (let i = 0; i < items.length; i++) {
    const st = await processChunk(db, plan, [items[i]], 'apply');
    if (!st.updated) continue;
    const id = items[i].id;
    console.log(`Prueba: desactivado ${id}; esperando ${CANARY_WAIT_MS / 1000} s para ver si el trigger lo reactiva...`);
    const ref = db.collection('resources').doc(id);
    const deadline = Date.now() + CANARY_WAIT_MS;
    while (Date.now() < deadline) {
      await sleep(5000);
      if ((await ref.get()).get('status') === 'Disponible') {
        await ref.update({ deactivation: admin.firestore.FieldValue.delete() }).catch(() => {});
        throw new Error(
          `El recurso de prueba ${id} ha vuelto a 'Disponible': el trigger updateResource desplegado todavía tiene el fallo.\n` +
          'Despliega primero la corrección:  firebase deploy --only functions:updateResource'
        );
      }
    }
    console.log('    OK: sigue como No disponible.');
    return i + 1; // ítems ya procesados
  }
  return items.length;
}

async function runPlan(db, file, mode) {
  const plan = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  if (!plan.runId || !Array.isArray(plan.items)) throw new Error('El fichero no parece un plan generado por este script');
  if (!plan.items.length) { console.log('El plan está vacío, no hay nada que hacer.'); return; }

  const ageDays = (Date.now() - new Date(plan.createdAt).getTime()) / 864e5;
  if (mode === 'apply' && ageDays > PLAN_MAX_AGE_DAYS) {
    throw new Error(`El plan tiene ${ageDays.toFixed(1)} días (máximo ${PLAN_MAX_AGE_DAYS}). Genera uno nuevo ejecutando el script sin --apply.`);
  }

  const byBlock = {};
  for (const it of plan.items) byBlock[it.block] = (byBlock[it.block] || 0) + 1;
  console.log(`Plan ${plan.runId} (generado ${plan.createdAt})`);
  console.table(byBlock);
  const verb = mode === 'apply' ? `DESACTIVAR ${plan.items.length} recursos` : `REACTIVAR los recursos desactivados con ${plan.runId}`;
  await confirm(`Se van a ${verb} en PRODUCCIÓN (${PROJECT_ID}).`);

  let items = plan.items;
  const total = { updated: 0, skipped: 0, missing: 0 };
  if (mode === 'apply') {
    const used = await canary(db, plan, items);
    total.updated = 1;
    total.skipped = used - 1; // los que la prueba se saltó por no estar ya 'Disponible'
    items = items.slice(used);
  }

  const t0 = Date.now();
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const st = await processChunk(db, plan, items.slice(i, i + BATCH_SIZE), mode);
    total.updated += st.updated;
    total.skipped += st.skipped;
    total.missing += st.missing;
    const done = Math.min(i + BATCH_SIZE, items.length);
    console.log(`    ${done}/${items.length} · actualizados ${total.updated} (${Math.round((Date.now() - t0) / 1000)} s)`);
    await sleep(500); // dar aire a los triggers de cada actualización
  }

  console.log(`\nHecho. Actualizados: ${total.updated} · saltados (ya no estaban en el estado esperado): ${total.skipped} · no existen: ${total.missing}`);
  if (mode === 'apply') {
    console.log(`Para deshacerlo:  node scripts/deactivate-stale-resources.js --revert ${file}`);
    console.log(`En Firestore se pueden filtrar con deactivation.runId == "${plan.runId}"`);
  }
}

// ---------- Main ----------
if (require.main === module) {
  (async () => {
    if (APPLY && REVERT) throw new Error('Usa --apply o --revert, no los dos');
    admin.initializeApp({ projectId: PROJECT_ID });
    const db = admin.firestore();
    if (APPLY) await runPlan(db, APPLY, 'apply');
    else if (REVERT) await runPlan(db, REVERT, 'revert');
    else await buildPlan(db);
    process.exit(0);
  })().catch((e) => {
    console.error(`\n❌ ${e.message || e}`);
    process.exit(1);
  });
}

module.exports = { decide, normalizeLink, sceCode };
