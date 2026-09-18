#!/usr/bin/env node
/**
 * Забирает корпус конкурентов по колонке «URLs группы» из кластеризации.
 *
 *   node tools/fetch-corpus.mjs               — качает недостающее
 *   node tools/fetch-corpus.mjs --dry-run     — только показывает, что бы взял
 *   node tools/fetch-corpus.mjs --limit 50    — первые N адресов (проба)
 *   node tools/fetch-corpus.mjs --only-host www.reddit.com
 *   node tools/fetch-corpus.mjs --force       — перекачать уже скачанное
 *   node tools/fetch-corpus.mjs --concurrency 8
 *   node tools/fetch-corpus.mjs --report      — пересчитать сводку по манифесту
 *
 * Копия инструмента первого сайта (`sites/ac4bf-thewatch.com/tools/
 * fetch-corpus.mjs`) с тремя отличиями, названными в бэклоге 52 п. 6–7:
 *
 *   1. xlsx читает адаптер ядра `core/structure/clustering.mjs`, а не свой
 *      читатель zip: у выгрузки второго сайта другой формат (один лист,
 *      «Частотность»), и второго читателя xlsx в репозитории быть не должно;
 *   2. путь к выгрузке и дата снимка — из `structure/structure.json`
 *      (`site.semantics`, `site.semantics_date`), не константы в коде;
 *   3. движок, гео и язык снимка — из `structure/rules-s0.json`, раздел
 *      «снимок»; там же они и меняются.
 *
 * Инструмент делает ровно одно: забирает документы, пока они соответствуют
 * снимку выдачи. Он не решает судьбы кластеров, не строит `structure.json`
 * и не считает статистику — это `recon-s0.mjs` и сессия структуры.
 *
 * **Дата и запрос пишутся рядом с каждым документом** (`docs/REUSE.md` §3).
 * **Сырой HTML в репозиторий не идёт** — в git остаётся манифест, по нему
 * корпус пересобирается (`.gitignore`: `sites/* /input/corpus/raw/`).
 * **Чужой текст отсюда не извлекается** ни в план, ни в промпт, ни как
 * пример формулировки — `docs/REUSE.md`, «Что извлекается и что не
 * извлекается никогда». Инструмент только складывает документы на диск.
 *
 * Забор широкий — по всей семантике, не по дереву (дерева ещё нет; бэклог 9,
 * П63 п. 2 (в)).
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readClustering, UNCLUSTERED } from '@factory/core/structure/clustering.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docPath = join(root, 'structure/structure.json');
const rulesPath = join(root, 'structure/rules-s0.json');
const outDir = join(root, 'input/corpus');
const rawDir = join(outDir, 'raw');
const manifestPath = join(outDir, 'manifest.jsonl');
const runPath = join(outDir, 'run.json');
const queriesPath = join(outDir, 'queries.json');

const site = JSON.parse(readFileSync(docPath, 'utf8')).site;
const snapshot = JSON.parse(readFileSync(rulesPath, 'utf8'))['снимок'];
const source = join(root, site.semantics);

// Только ASCII: HTTP-заголовок — ByteString, не-ASCII роняет fetch до выхода
// в сеть (урок первого сайта: тридцать «сетевых ошибок» в первой пробе).
const UA = '7thserpent-corpus/1.0 (+page-structure research; contact: site owner)';
const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 25_000;
const HOST_DELAY_MS = 1500;

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const dryRun = flag('--dry-run');
const force = flag('--force');
const limit = Number(value('--limit', 0)) || 0;
const onlyHost = value('--only-host', null);
const concurrency = Number(value('--concurrency', 6)) || 6;

/* ---------------------------------------------------------------- *
 * robots.txt: разбор и решение.
 * ---------------------------------------------------------------- */

function parseRobots(text) {
  const groups = [];
  let current = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split('#')[0].trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const val = line.slice(idx + 1).trim();
    if (field === 'user-agent') {
      if (!current || current.rules.length || current.delay !== null) {
        current = { agents: [], rules: [], delay: null };
        groups.push(current);
      }
      current.agents.push(val.toLowerCase());
    } else if (current && (field === 'allow' || field === 'disallow')) {
      current.rules.push({ allow: field === 'allow', path: val });
    } else if (current && field === 'crawl-delay') {
      const d = Number(val.replace(',', '.'));
      if (Number.isFinite(d)) current.delay = d * 1000;
    }
  }
  return groups;
}

function pickGroup(groups, ua) {
  const lower = ua.toLowerCase();
  let best = null;
  let bestLen = -1;
  for (const g of groups) {
    for (const a of g.agents) {
      if (a !== '*' && lower.includes(a) && a.length > bestLen) { best = g; bestLen = a.length; }
    }
  }
  if (best) return best;
  return groups.find((g) => g.agents.includes('*')) || null;
}

function robotsAllows(group, pathname) {
  if (!group) return true;
  let verdict = true;
  let bestLen = -1;
  for (const r of group.rules) {
    if (r.path === '') continue; // пустой Disallow разрешает всё
    const pattern = r.path;
    if (matchRobots(pattern, pathname) && pattern.length > bestLen) {
      bestLen = pattern.length;
      verdict = r.allow;
    }
  }
  return verdict;
}

function matchRobots(pattern, path) {
  // Поддержаны * и завершающий $ — этого достаточно для сегодняшних robots.
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const parts = body.split('*').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp('^' + parts.join('.*') + (anchored ? '$' : ''));
  return re.test(path);
}

/* ---------------------------------------------------------------- *
 * Сбор адресов из кластеризации — через адаптер ядра.
 * ---------------------------------------------------------------- */

let clustering = null;
const data = () => (clustering ??= readClustering(source));

function collect() {
  const byUrl = new Map();
  for (const p of data().phrases) {
    for (const url of p.urls) {
      if (!byUrl.has(url)) byUrl.set(url, { url, groups: new Set(), phrases: new Set() });
      const rec = byUrl.get(url);
      if (p.cluster) rec.groups.add(p.cluster);
      if (p.phrase) rec.phrases.add(p.phrase);
    }
  }
  // Фразы в запись документа не кладутся: один адрес приходит из десятков
  // фраз, и манифест распух бы на дублировании. Соответствие «фраза → адрес»
  // хранится один раз в `queries.json`. Группы короткие и остаются на месте.
  return [...byUrl.values()].map((r, i) => ({
    n: i + 1,
    url: r.url,
    host: safeHost(r.url),
    groups: [...r.groups].sort(),
    phrases_n: r.phrases.size,
  }));
}

function safeHost(u) {
  try { return new URL(u).host; } catch { return ''; }
}

/* ---------------------------------------------------------------- *
 * Покрытие по кластерам — вход сессии структуры.
 * ---------------------------------------------------------------- */

/**
 * Сколько документов кластера удалось забрать, и что с этим можно делать.
 * Три корзины заданы владельцем (первый сайт, П24):
 *
 *   ≥7 из десяти — анатомию страницы считаем с порогом частоты;
 *   4–6          — считаем с оговоркой;
 *   ≤3           — анатомию по кластеру не считаем вовсе, только план
 *                  содержания.
 *
 * **«Некластеризовано» кластером не считается**: у каждой фразы своя
 * выдача, покрытие считается по фразе.
 */
const BUCKETS = [
  { key: 'high', min: 7, range: '≥7', verdict: 'анатомия с порогом частоты' },
  { key: 'mid', min: 4, range: '4–6', verdict: 'анатомия с оговоркой' },
  { key: 'low', min: 0, range: '≤3', verdict: 'только план содержания' },
];

const bucketOf = (ok) => BUCKETS.find((b) => ok >= b.min);

function readSnapshot() {
  const byGroup = new Map();
  const byPhrase = new Map();
  for (const p of data().phrases) {
    if (!p.urls.length) continue;
    if (p.cluster) {
      if (!byGroup.has(p.cluster)) byGroup.set(p.cluster, new Set());
      for (const u of p.urls) byGroup.get(p.cluster).add(u);
    }
    if (p.phrase) {
      if (!byPhrase.has(p.phrase)) byPhrase.set(p.phrase, { group: p.cluster, urls: new Set() });
      for (const u of p.urls) byPhrase.get(p.phrase).urls.add(u);
    }
  }
  return { byGroup, byPhrase };
}

function buildCoverage(done) {
  const { byGroup, byPhrase } = readSnapshot();
  const okUrl = (u) => done.get(u)?.outcome === 'ok';

  const tally = (name, urls) => {
    const list = [...urls];
    const ok = list.filter(okUrl).length;
    const b = bucketOf(ok);
    return { name, urls: list.length, ok, bucket: b.key, verdict: b.verdict };
  };

  const clusters = [...byGroup]
    .filter(([g]) => g !== UNCLUSTERED)
    .map(([g, urls]) => tally(g, urls))
    .sort((a, b) => b.ok - a.ok || a.name.localeCompare(b.name));

  const phrases = [...byPhrase]
    .filter(([, v]) => v.group === UNCLUSTERED)
    .map(([p, v]) => tally(p, v.urls))
    .sort((a, b) => b.ok - a.ok || a.name.localeCompare(b.name));

  const count = (list) =>
    Object.fromEntries(BUCKETS.map((b) => [b.key, list.filter((x) => x.bucket === b.key).length]));

  return {
    правило: BUCKETS.map((b) => `${b.key}: скачано ${b.range} из выдачи кластера — ${b.verdict}`),
    кластеры: {
      всего: clusters.length,
      корзины: count(clusters),
      медиана_скачано: clusters.length ? [...clusters].map((c) => c.ok).sort((a, b) => a - b)[Math.floor(clusters.length / 2)] : 0,
      // Корзина задана абсолютным числом, а выдача кластера не всегда
      // десять: кластер с тремя адресами попадает в `low`, ничего не потеряв,
      // — и путать его с недобранным нельзя.
      нижняя_корзина: {
        выдача_была_короткой: clusters.filter((c) => c.bucket === 'low' && c.urls <= 3).length,
        недобрано: clusters.filter((c) => c.bucket === 'low' && c.urls >= 4).length,
        скачано_ноль: clusters.filter((c) => c.ok === 0).length,
      },
      список: clusters,
    },
    некластеризованные_фразы: {
      всего: phrases.length,
      корзины: count(phrases),
      список: phrases,
    },
  };
}

/* ---------------------------------------------------------------- *
 * Скачивание.
 * ---------------------------------------------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Undici роняет отказ сокета мимо промиса: сервер закрывает HTTP/2-соединение,
 * и событие `error` приходит на поток, которого никто не ждёт. У первого
 * сайта такой отказ убил прогон на 2425-м адресе. Здесь он записывается
 * и работа идёт дальше; всё остальное по-прежнему валит процесс, потому что
 * молчаливо продолжать после неизвестной ошибки хуже, чем остановиться.
 */
const SOCKET_CODES = new Set([
  'UND_ERR_SOCKET', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'ECONNABORTED',
  'ERR_HTTP2_STREAM_ERROR', 'ERR_HTTP2_STREAM_CANCEL', 'ERR_HTTP2_SESSION_ERROR',
]);
let strayErrors = 0;
process.on('uncaughtException', (err) => {
  const socketish = SOCKET_CODES.has(err?.code) || /socket|http2/i.test(String(err?.message || ''));
  if (!socketish) {
    console.error(err);
    process.exit(1);
  }
  strayErrors += 1;
  console.error(`  отказ сокета мимо запроса (${err.code || err.name}) — прогон продолжается`);
});

async function getRobots(origin) {
  try {
    const res = await fetch(origin + '/robots.txt', {
      headers: { 'user-agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { group: null, delay: null };
    const text = await res.text();
    const group = pickGroup(parseRobots(text), UA);
    return { group, delay: group?.delay ?? null };
  } catch {
    // robots недоступен — по стандарту это «можно», отказ сети не запрет.
    return { group: null, delay: null };
  }
}

async function fetchOne(item, robots) {
  const started = new Date().toISOString();
  const base = { ...item, fetched_at: started };
  let pathname = '/';
  try { pathname = new URL(item.url).pathname + new URL(item.url).search; } catch {}

  if (!robotsAllows(robots.group, pathname)) {
    return { ...base, outcome: 'robots-disallowed', status: null };
  }

  try {
    const res = await fetch(item.url, {
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const type = res.headers.get('content-type') || '';
    if (!res.ok) {
      return { ...base, outcome: 'http-error', status: res.status, final_url: res.url, content_type: type };
    }
    if (!/text\/html|application\/xhtml/i.test(type)) {
      return { ...base, outcome: 'not-html', status: res.status, final_url: res.url, content_type: type };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      return { ...base, outcome: 'too-large', status: res.status, final_url: res.url, content_type: type, bytes: buf.length };
    }
    const sha = createHash('sha256').update(buf).digest('hex');
    // Храним сжатым: gzip срезает объём примерно вшестеро, а читателю корпуса
    // разжатие стоит одной строки.
    const packed = gzipSync(buf, { level: 9 });
    const name = createHash('sha1').update(item.url).digest('hex').slice(0, 16) + '.html.gz';
    const dir = join(rawDir, item.host || 'bez-hosta');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name), packed);
    return {
      ...base,
      outcome: 'ok',
      status: res.status,
      final_url: res.url,
      content_type: type,
      bytes: buf.length,
      bytes_stored: packed.length,
      sha256: sha,
      file: `raw/${item.host || 'bez-hosta'}/${name}`,
    };
  } catch (err) {
    const kind = err?.name === 'TimeoutError' || /timeout/i.test(String(err?.message)) ? 'timeout' : 'network-error';
    return { ...base, outcome: kind, status: null, error: String(err?.message || err).slice(0, 200) };
  }
}

/* ---------------------------------------------------------------- *
 * Ход работы: по хосту последовательно, хосты — параллельно.
 * ---------------------------------------------------------------- */

async function main() {
  if (!existsSync(source)) {
    console.error(`нет входного файла: ${source}`);
    process.exit(1);
  }

  let items = collect();
  const total = items.length;
  if (onlyHost) items = items.filter((i) => i.host === onlyHost);

  const done = force ? new Map() : loadManifest();

  // `--report` пересчитывает сводку по уже собранному манифесту и ничего
  // не качает: покрытие по кластерам нужно и после прогона, и после его
  // падения, и просто чтобы посмотреть.
  if (flag('--report')) {
    const run = writeRun(done, { attempted: 0, counts: new Map(), startedAt: null });
    printCoverage(run.coverage);
    console.log(`\nсводка пересчитана: input/corpus/run.json`);
    return;
  }
  // Повторяем только временные отказы. Запрет robots, 403 и «не HTML»
  // повтором другими не станут, а стучаться в них заново — невежливо.
  const settled = (r) => {
    if (!r) return false;
    if (['ok', 'robots-disallowed', 'not-html', 'too-large'].includes(r.outcome)) return true;
    if (r.outcome === 'http-error') return r.status >= 400 && r.status < 500 && r.status !== 429;
    return false;
  };
  const pending = items.filter((i) => !settled(done.get(i.url)));
  const work = limit ? pending.slice(0, limit) : pending;

  const hosts = new Map();
  for (const it of work) {
    if (!hosts.has(it.host)) hosts.set(it.host, []);
    hosts.get(it.host).push(it);
  }

  console.log(`кластеризация: ${site.semantics} (формат ${data().meta.format}, объём — «${data().meta.volumeColumn}»)`);
  console.log(`адресов всего: ${total}, к работе: ${work.length}, хостов: ${hosts.size}`);
  if (done.size) console.log(`уже в манифесте: ${done.size} (успешных ${[...done.values()].filter((r) => r.outcome === 'ok').length})`);

  if (dryRun) {
    const byHost = [...hosts].sort((a, b) => b[1].length - a[1].length).slice(0, 15);
    console.log('\nтоп хостов по числу адресов:');
    for (const [h, list] of byHost) console.log(`  ${String(list.length).padStart(4)}  ${h}`);
    console.log('\n--dry-run: ничего не скачано.');
    return;
  }

  mkdirSync(rawDir, { recursive: true });
  writeFileSync(queriesPath, JSON.stringify(buildQueries(), null, 1) + '\n');

  const counts = new Map();
  let processed = 0;
  const startedAt = new Date().toISOString();
  const queue = [...hosts.values()];

  async function worker() {
    while (queue.length) {
      const list = queue.shift();
      if (!list) break;
      const origin = safeOrigin(list[0].url);
      const robots = origin ? await getRobots(origin) : { group: null, delay: null };
      const delay = Math.max(robots.delay ?? 0, HOST_DELAY_MS);
      for (const item of list) {
        const rec = await fetchOne(item, robots);
        appendFileSync(manifestPath, JSON.stringify(rec) + '\n');
        counts.set(rec.outcome, (counts.get(rec.outcome) || 0) + 1);
        processed += 1;
        if (processed % 25 === 0) {
          const parts = [...counts].sort().map(([k, v]) => `${k} ${v}`).join(', ');
          console.log(`  ${processed}/${work.length} — ${parts}`);
        }
        // Задержка вежливости платится только за настоящий запрос: отказ
        // по robots.txt сети не касался.
        if (rec.outcome !== 'robots-disallowed') await sleep(delay);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));

  const run = writeRun(loadManifest(), { attempted: work.length, counts, startedAt, hosts: hosts.size });

  console.log('\nитог прогона:');
  for (const [k, v] of [...counts].sort()) console.log(`  ${k.padEnd(18)} ${v}`);
  if (strayErrors) console.log(`  отказов сокета мимо запроса: ${strayErrors}`);
  printCoverage(run.coverage);
  console.log(`\nманифест: input/corpus/manifest.jsonl`);
  console.log(`сводка:   input/corpus/run.json`);
}

function loadManifest() {
  const done = new Map();
  if (!existsSync(manifestPath)) return done;
  for (const line of readFileSync(manifestPath, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { const r = JSON.parse(line); done.set(r.url, r); } catch {}
  }
  return done;
}

function writeRun(done, { attempted, counts, startedAt, hosts }) {
  const tally = new Map();
  for (const r of done.values()) tally.set(r.outcome, (tally.get(r.outcome) || 0) + 1);

  const times = [...done.values()].map((r) => r.fetched_at).filter(Boolean).sort();
  const stamps = { first: times[0] ?? null, last: times.at(-1) ?? null };

  // Строк в манифесте больше, чем адресов: повтор дописывается новой записью,
  // прежняя остаётся историей попытки. Считается последняя запись по адресу.
  const lines = existsSync(manifestPath)
    ? readFileSync(manifestPath, 'utf8').split('\n').filter((l) => l.trim()).length
    : 0;

  // Всё выводится из манифеста, а не из хода прогона: сводка обязана быть
  // верной, чем бы её ни пересчитали и сколько бы заходов ни потребовалось.
  const run = {
    tool: 'tools/fetch-corpus.mjs',
    source: site.semantics,
    source_sha256: data().meta.sha256,
    source_format: data().meta.format,
    volume_column: data().meta.volumeColumn,
    serp_snapshot_date: site.semantics_date,
    engine: snapshot['движок'],
    geo: snapshot['гео'],
    language: snapshot['язык'],
    first_fetch_at: stamps.first,
    last_fetch_at: stamps.last,
    summary_written_at: new Date().toISOString(),
    urls_total: collect().length,
    urls_in_manifest: done.size,
    manifest_lines: lines,
    manifest_note: 'строк больше, чем адресов: повтор дописывается новой записью. Считается последняя запись по адресу.',
    hosts: new Set([...done.values()].map((r) => r.host).filter(Boolean)).size,
    outcomes: Object.fromEntries([...tally].sort()),
    bytes_raw: [...done.values()].reduce((a, r) => a + (r.bytes || 0), 0),
    bytes_stored: [...done.values()].reduce((a, r) => a + (r.bytes_stored || 0), 0),
    user_agent: UA,
    host_delay_ms: HOST_DELAY_MS,
    storage: 'raw/<host>/<sha1(url)>.html.gz — gzip; в git не идёт (.gitignore)',
    queries: 'queries.json — соответствие «фраза → группа и адреса»; в записи документа фразы не дублируются',
    note: 'Сырой HTML в git не идёт; корпус пересобирается этим инструментом по манифесту.',
    coverage: buildCoverage(done),
  };
  writeFileSync(runPath, JSON.stringify(run, null, 1) + '\n');
  return run;
}

function printCoverage(cov) {
  const c = cov['кластеры'];
  const f = cov['некластеризованные_фразы'];
  console.log('\nпокрытие кластеров — скачано документов из выдачи кластера:');
  for (const b of BUCKETS) {
    console.log(`  ${b.key.padEnd(5)} ${String(c['корзины'][b.key]).padStart(4)} из ${c['всего']}  — ${b.verdict}`);
  }
  console.log(`  медиана скачанного на кластер: ${c['медиана_скачано']}`);
  const n = c['нижняя_корзина'];
  console.log(`  из нижней корзины: ${n['выдача_была_короткой']} с короткой выдачей (терять нечего), ${n['недобрано']} недобрано, ${n['скачано_ноль']} пусты`);
  console.log(`некластеризованных фраз: ${f['всего']} — high ${f['корзины'].high}, mid ${f['корзины'].mid}, low ${f['корзины'].low}`);
}

function safeOrigin(u) {
  try { return new URL(u).origin; } catch { return null; }
}

function buildQueries() {
  const out = {};
  for (const p of data().phrases) {
    if (!p.phrase) continue;
    out[p.phrase] = { group: p.cluster, urls: p.urls };
  }
  return {
    snapshot_date: site.semantics_date,
    engine: snapshot['движок'],
    geo: snapshot['гео'],
    language: snapshot['язык'],
    phrases: out,
  };
}

await main();
