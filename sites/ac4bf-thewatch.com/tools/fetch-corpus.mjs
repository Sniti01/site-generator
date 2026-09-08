#!/usr/bin/env node
/**
 * Забирает корпус конкурентов по колонке «URLs группы» из кластеризации.
 *
 *   node tools/fetch-corpus.mjs               — качает недостающее
 *   node tools/fetch-corpus.mjs --dry-run     — только показывает, что бы взял
 *   node tools/fetch-corpus.mjs --limit 50    — первые N адресов (проба)
 *   node tools/fetch-corpus.mjs --only-host www.gry-online.pl
 *   node tools/fetch-corpus.mjs --force       — перекачать уже скачанное
 *   node tools/fetch-corpus.mjs --concurrency 8
 *
 * Пункт 2 `docs/BACKLOG.md`. Инструмент делает ровно одно: забирает документы,
 * пока они соответствуют снимку выдачи. Он не решает судьбы кластеров,
 * не строит `structure.json` и не считает статистику — это пункт 1 и сессия
 * структуры.
 *
 * **Дата и запрос пишутся рядом с каждым документом.** Это прямо тот пробел,
 * который `docs/REUSE.md` §3 нашёл у `../1weekinvr.com`: запрос там записан,
 * а даты нет нигде. Чинится при переносе, не потом.
 *
 * **Сырой HTML в репозиторий не идёт** — это гигабайты чужого кода. В git
 * остаётся манифест: по нему корпус пересобирается, а хеши позволяют увидеть,
 * что за это время изменилось. Порядок взят у соседа: `.gitignore`
 * в `../1weekinvr.com` исключает сырые папки корпуса по той же причине.
 *
 * **Чужой текст отсюда не извлекается** ни в план, ни в промпт, ни как пример
 * формулировки — `docs/REUSE.md`, «Что извлекается и что не извлекается
 * никогда». Инструмент только складывает документы на диск.
 *
 * Комментарии здесь по-русски, а не по-польски, как у соседей в `tools/`:
 * те инструменты производят содержимое страницы, этот — исследовательский
 * вход, который на сайт не попадает.
 *
 * Зависимостей нет: xlsx распаковывается своим читателем zip, `robots.txt`
 * разбирается своим разбором. Ставить пакет ради одного файла не нужно.
 */

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { inflateRawSync, gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'input/clustering-google-2026-09-07.xlsx');
const outDir = join(root, 'input/corpus');
const rawDir = join(outDir, 'raw');
const manifestPath = join(outDir, 'manifest.jsonl');
const runPath = join(outDir, 'run.json');
const queriesPath = join(outDir, 'queries.json');

// Только ASCII: HTTP-заголовок — ByteString, и польские диакритики роняют
// fetch до выхода в сеть. Стоило тридцати «сетевых ошибок» в первой пробе.
const UA = 'ac4bf-thewatch-corpus/1.0 (+page-structure research; contact: site owner)';
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
 * Читатель zip: xlsx это zip, а зависимостей у инструмента нет.
 * ---------------------------------------------------------------- */

function unzip(buf) {
  // Конец центрального каталога ищем с хвоста: комментарий бывает непустым.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 65536; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('не найден конец центрального каталога zip');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);

  const files = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('битая запись каталога zip');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;

    // Локальный заголовок: длины полей имени и extra там свои.
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const chunk = buf.subarray(start, start + compSize);
    files.set(name, method === 0 ? chunk : inflateRawSync(chunk));
  }
  return files;
}

/* ---------------------------------------------------------------- *
 * Разбор листа xlsx.
 * ---------------------------------------------------------------- */

const unesc = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');

function readSheet(files, sheet = 'xl/worksheets/sheet1.xml') {
  const shared = [];
  const ss = files.get('xl/sharedStrings.xml');
  if (ss) {
    for (const m of ss.toString('utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      shared.push([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => unesc(t[1])).join(''));
    }
  }
  const xml = files.get(sheet).toString('utf8');
  const rows = [];
  for (const rm of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = {};
    for (const cm of rm[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const ref = (cm[1].match(/r="([A-Z]+)\d+"/) || [])[1];
      if (!ref) continue;
      const type = (cm[1].match(/t="([^"]+)"/) || [])[1];
      if (type === 'inlineStr') {
        cells[ref] = [...cm[2].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => unesc(t[1])).join('');
      } else {
        const v = (cm[2].match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        cells[ref] = type === 's' ? (shared[Number(v)] ?? '') : v === undefined ? '' : unesc(v);
      }
    }
    rows.push(cells);
  }
  return rows;
}

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
 * Сбор адресов из кластеризации.
 * ---------------------------------------------------------------- */

function collect() {
  const buf = readFileSync(source);
  const rows = readSheet(unzip(buf));
  const head = rows[0];
  const col = {};
  for (const [letter, title] of Object.entries(head)) col[title] = letter;

  const need = ['Поисковые запросы', 'Название группы', 'URLs группы'];
  for (const n of need) if (!col[n]) throw new Error(`в кластеризации нет колонки «${n}»`);

  const byUrl = new Map();
  for (const cells of rows.slice(1)) {
    const phrase = (cells[col['Поисковые запросы']] || '').trim();
    const group = (cells[col['Название группы']] || '').trim();
    const raw = (cells[col['URLs группы']] || '').trim();
    if (!raw) continue;
    for (const piece of raw.split(/[\s,]+/)) {
      const url = piece.replace(/[.,;]+$/, '');
      if (!/^https?:\/\//i.test(url)) continue;
      if (!byUrl.has(url)) byUrl.set(url, { url, groups: new Set(), phrases: new Set() });
      const rec = byUrl.get(url);
      if (group) rec.groups.add(group);
      if (phrase) rec.phrases.add(phrase);
    }
  }
  // Фразы в запись документа не кладутся: один адрес приходит из сотни фраз,
  // и манифест распух бы вчетверо на дублировании. Соответствие «фраза → адрес»
  // хранится один раз в `queries.json`, откуда восстанавливается в обе стороны.
  // Группы короткие и остаются на месте — по ним видно контекст сразу.
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
 * Скачивание.
 * ---------------------------------------------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    // Храним сжатым: проба дала в среднем 750 КБ на документ, то есть около
    // 2,5 ГБ на весь корпус. gzip срезает это примерно вшестеро, а читателю
    // корпуса разжатие стоит одной строки.
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

  const done = new Map();
  if (existsSync(manifestPath) && !force) {
    for (const line of readFileSync(manifestPath, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try { const r = JSON.parse(line); done.set(r.url, r); } catch {}
    }
  }
  const pending = items.filter((i) => !(done.get(i.url)?.outcome === 'ok'));
  const work = limit ? pending.slice(0, limit) : pending;

  const hosts = new Map();
  for (const it of work) {
    if (!hosts.has(it.host)) hosts.set(it.host, []);
    hosts.get(it.host).push(it);
  }

  console.log(`кластеризация: ${source.replace(/\\/g, '/')}`);
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

  const run = {
    tool: 'tools/fetch-corpus.mjs',
    source: 'input/clustering-google-2026-09-07.xlsx',
    source_sha256: createHash('sha256').update(readFileSync(source)).digest('hex'),
    serp_snapshot_date: '2026-09-07',
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    urls_total: total,
    urls_attempted: work.length,
    hosts: hosts.size,
    outcomes: Object.fromEntries([...counts].sort()),
    user_agent: UA,
    host_delay_ms: HOST_DELAY_MS,
    storage: 'raw/<host>/<sha1(url)>.html.gz — gzip; в git не идёт (.gitignore)',
    queries: 'queries.json — соответствие «фраза → группа и адреса»; в записи документа фразы не дублируются',
    note: 'Сырой HTML в git не идёт; корпус пересобирается этим инструментом по манифесту.',
  };
  writeFileSync(runPath, JSON.stringify(run, null, 1) + '\n');

  console.log('\nитог:');
  for (const [k, v] of [...counts].sort()) console.log(`  ${k.padEnd(18)} ${v}`);
  console.log(`\nманифест: input/corpus/manifest.jsonl`);
  console.log(`сводка:   input/corpus/run.json`);
}

function safeOrigin(u) {
  try { return new URL(u).origin; } catch { return null; }
}

function buildQueries() {
  const rows = readSheet(unzip(readFileSync(source)));
  const head = rows[0];
  const col = {};
  for (const [letter, title] of Object.entries(head)) col[title] = letter;
  const out = {};
  for (const cells of rows.slice(1)) {
    const phrase = (cells[col['Поисковые запросы']] || '').trim();
    const group = (cells[col['Название группы']] || '').trim();
    const raw = (cells[col['URLs группы']] || '').trim();
    if (!phrase) continue;
    const urls = raw
      .split(/[\s,]+/)
      .map((s) => s.replace(/[.,;]+$/, ''))
      .filter((s) => /^https?:\/\//i.test(s));
    out[phrase] = { group, urls };
  }
  return { snapshot_date: '2026-09-07', engine: 'google', geo: 'PL', language: 'pl', phrases: out };
}

await main();
