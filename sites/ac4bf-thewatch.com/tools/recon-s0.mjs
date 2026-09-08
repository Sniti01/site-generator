#!/usr/bin/env node
/**
 * Разведка данных перед контрактом структуры — стадия S0
 * (`docs/05_STRUCTURE_TASK.md`).
 *
 *   node tools/recon-s0.mjs            — считает и пишет structure/s0-recon.json
 *   node tools/recon-s0.mjs --dry-run  — только печатает сводку
 *
 * Инструмент **предлагает**, а не решает: пороги хвоста, черновик `no_page`
 * и судьбы некластеризованных фраз выходят отсюда пачками, которые
 * подтверждает владелец. Правила и словари живут в `structure/rules-s0.json`
 * и меняются там, а не здесь: порог, зашитый в код, через месяц никто
 * не найдёт.
 *
 * Источник истины — колонки Google (лист «Легенда» выгрузки). WS считается
 * и печатается только для сравнения.
 *
 * Чужой текст отсюда не извлекается: инструмент читает частотности, состав
 * топа по хостам и исходы скачивания. Ни одной формулировки конкурента
 * в выходе нет и быть не должно — `docs/REUSE.md`, «Что извлекается
 * и что не извлекается никогда».
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readClustering, groupPhrases, clusterUrls, hostOf, UNCLUSTERED } from './lib/clustering.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'input/clustering-google-2026-09-07.xlsx');
const rulesPath = join(root, 'structure/rules-s0.json');
const corpusRun = join(root, 'input/corpus/run.json');
const corpusManifest = join(root, 'input/corpus/manifest.jsonl');
const outPath = join(root, 'structure/s0-recon.json');

const dryRun = process.argv.includes('--dry-run');

const rules = JSON.parse(readFileSync(rulesPath, 'utf8'));
const data = readClustering(source);
const byCluster = groupPhrases(data.phrases);

/* ---------------------------------------------------------------- *
 * Совпадение по словарю: границей слова служит всё, что не буква
 * и не цифра. `\b` здесь не годится — он не знает польских букв.
 * ---------------------------------------------------------------- */

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordsRe = (list) => new RegExp(`(^|[^\\p{L}\\p{N}])(${list.map(esc).join('|')})($|[^\\p{L}\\p{N}])`, 'iu');
const hitWord = (text, list) => {
  const m = wordsRe(list).exec(text);
  return m ? m[2] : null;
};

/* ---------------------------------------------------------------- *
 * Исходы скачивания корпуса: адрес → исход последней записи.
 * ---------------------------------------------------------------- */

function corpusOutcomes() {
  if (!existsSync(corpusManifest)) return new Map();
  const map = new Map();
  for (const line of readFileSync(corpusManifest, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const rec = JSON.parse(line);
    map.set(rec.url, rec.outcome); // повтор дописан ниже — побеждает последняя
  }
  return map;
}
const outcomes = corpusOutcomes();
const coverage = existsSync(corpusRun)
  ? new Map(JSON.parse(readFileSync(corpusRun, 'utf8')).coverage['кластеры']['список'].map((c) => [c.name, c]))
  : new Map();

/* ---------------------------------------------------------------- *
 * Полосы объёма: границы выводятся из распределения, а не назначаются.
 * ---------------------------------------------------------------- */

const real = data.clusters
  .filter((c) => c.name !== UNCLUSTERED)
  .sort((a, b) => b.google - a.google || a.name.localeCompare(b.name));
const totalGoogle = real.reduce((s, c) => s + c.google, 0);

function cutAt(share) {
  let acc = 0;
  for (let i = 0; i < real.length; i++) {
    acc += real[i].google;
    if (acc / totalGoogle >= share) return { index: i, count: i + 1, value: real[i].google, covered: acc };
  }
  return { index: real.length - 1, count: real.length, value: real[real.length - 1].google, covered: acc };
}

const headCut = cutAt(rules['хвост']['голова_доля']);
const midCut = cutAt(rules['хвост']['середина_доля']);

const bandOf = (google) => {
  if (google >= headCut.value) return 'голова';
  if (google >= midCut.value) return 'середина';
  return 'хвост';
};

const HIST_BINS = [0, 10, 20, 30, 50, 100, 200, 500, 1000, 5000, 20000, Infinity];
const histogram = HIST_BINS.slice(0, -1).map((lo, i) => {
  const hi = HIST_BINS[i + 1];
  const list = real.filter((c) => c.google >= lo && c.google < hi);
  return {
    от: lo,
    до: hi === Infinity ? null : hi,
    кластеров: list.length,
    объём: list.reduce((s, c) => s + c.google, 0),
  };
});

/* ---------------------------------------------------------------- *
 * Признаки кластера.
 * ---------------------------------------------------------------- */

const shop = rules['магазинный_интент'];
const marketplaces = new Set(shop['маркетплейсы']);
const platformStores = new Set(shop['площадки_платформ']);
const isMarketplace = (host) => marketplaces.has(host) || [...marketplaces].some((m) => host.endsWith('.' + m));
const isPlatformStore = (host) => platformStores.has(host) || [...platformStores].some((m) => host.endsWith('.' + m));

const hubOf = (text) => {
  for (const [hub, aliases] of Object.entries(rules['игры'])) {
    if (hub === 'почему') continue;
    if (hitWord(text, aliases)) return hub;
  }
  return null;
};

/**
 * Хаб кластера: сначала по имени, затем по фразам. Имя кластера даёт
 * кластеризатор, и оно не всегда называет игру: у кластера «assassins
 * creed 2010» все фразы про Brotherhood, а в имени — год.
 */
function hubOfCluster(name, list) {
  const byName = hubOf(name);
  if (byName) return { hub: byName, откуда: 'имя' };
  const votes = new Map();
  for (const p of list) {
    const h = hubOf(p.phrase);
    if (h) votes.set(h, (votes.get(h) || 0) + 1 + p.google / 1000);
  }
  if (!votes.size) return { hub: null, откуда: null };
  const best = [...votes].sort((a, b) => b[1] - a[1])[0][0];
  return { hub: best, откуда: 'фразы' };
}

function signals(name, list) {
  const urls = clusterUrls(list);
  const hosts = urls.map(hostOf);
  const market = hosts.filter(isMarketplace);
  const platform = hosts.filter(isPlatformStore);
  const refusedMarket = urls.filter((u) => {
    const o = outcomes.get(u);
    return isMarketplace(hostOf(u)) && (o === 'robots-disallowed' || o === 'http-error');
  });
  return {
    урлов: urls.length,
    маркетплейсов: market.length,
    сторов_платформ: platform.length,
    отказов_магазинов: refusedMarket.length,
    доля_отказов: urls.length ? Number((refusedMarket.length / urls.length).toFixed(2)) : 0,
    корзина: coverage.get(name)?.bucket ?? null,
    скачано: coverage.get(name)?.ok ?? null,
  };
}

/* ---------------------------------------------------------------- *
 * Судьба кластера.
 * ---------------------------------------------------------------- */

function verdictOf(cluster, sig, list) {
  const name = cluster.name;
  const { hub, откуда } = hubOfCluster(name, list);
  const hubNote = откуда === 'фразы' ? ' (хаб узнан по фразам, не по имени)' : '';

  const alien = hitWord(name, rules['чужие_вселенные']['не_наша_вселенная']);
  if (alien) {
    return { судьба: 'exclusions', причина: `чужая вселенная: «${alien}»`, уверенность: 'high' };
  }
  const cross = hitWord(name, rules['чужие_вселенные']['кроссовер']);
  if (cross) {
    return { судьба: 'no_page', причина: `кроссовер с чужой игрой: «${cross}»`, уверенность: 'medium' };
  }
  const side = hitWord(name, rules['побочные_темы']['имена']);
  if (side) {
    return { судьба: 'no_page', причина: `побочная тема серии: «${side}»`, уверенность: 'high' };
  }
  const shopWord = hitWord(name, shop['слова']);
  if (shopWord) {
    return { судьба: 'no_page', причина: `магазинное слово в имени кластера: «${shopWord}»`, уверенность: 'high' };
  }
  // Часть C.3 стоит выше признака выдачи: платформенный запрос информационен,
  // магазинной его выдачу делает рынок, а не спрос. Иначе «assassin ps4»
  // с шестью маркетплейсами в топе ушёл бы в no_page вместе с ключами,
  // ради которых заводится раздел «Na czym zagrać».
  const platformWord = hitWord(name, rules['платформы']['слова']);
  if (platformWord) {
    return {
      судьба: 'слить_в_хаб',
      цель: hub ?? 'assassins',
      причина: `платформенный кластер («${platformWord}»)${hub ? hubNote : ', игра не названа — платформенный запрос о серии'}`,
      уверенность: откуда === 'имя' ? 'high' : 'medium',
    };
  }
  if (sig['маркетплейсов'] >= shop['маркетплейсов_в_топе']) {
    return {
      судьба: 'no_page',
      причина: `в топе снимка ${sig['маркетплейсов']} маркетплейсов из ${sig['урлов']}`,
      уверенность: 'high',
    };
  }
  if (sig['урлов'] >= shop['отказ_корпуса_минимум_урлов'] && sig['доля_отказов'] >= shop['отказ_корпуса_доля']) {
    return {
      судьба: 'no_page',
      причина: `корпус недобран отказами магазинов: ${sig['отказов_магазинов']} из ${sig['урлов']}`,
      уверенность: 'medium',
    };
  }
  const place = hitWord(name, rules['исторические_места']['имена']);
  if (place) {
    return { судьба: 'карта_мест', цель: hub, причина: `историческое место: «${place}»`, уверенность: 'medium' };
  }
  const person = hitWord(name, rules['исторические_лица']['имена']);
  if (person) {
    return { судьба: 'люди_истории', цель: hub, причина: `историческое лицо: «${person}»`, уверенность: 'medium' };
  }
  const band = bandOf(cluster.google);
  if (band === 'голова') {
    return { судьба: 'страница', цель: hub, причина: `голова распределения (≥ ${headCut.value}/мес)`, уверенность: 'high' };
  }
  if (band === 'середина') {
    return {
      судьба: 'волна_2',
      цель: hub,
      причина: `середина распределения (${midCut.value}–${headCut.value}/мес)${hub ? hubNote : ''}`,
      уверенность: 'medium',
    };
  }
  return {
    судьба: hub ? 'слить_в_хаб' : 'no_page',
    цель: hub,
    причина: hub
      ? `хвост (< ${midCut.value}/мес), тема хаба «${hub}»${hubNote}`
      : `хвост (< ${midCut.value}/мес), тема не восстановлена ни по имени, ни по фразам`,
    уверенность: hub ? 'medium' : 'low',
  };
}

const clusters = real.map((c) => {
  const list = byCluster.get(c.name) || [];
  const sig = signals(c.name, list);
  const v = verdictOf(c, sig, list);
  return {
    кластер: c.name,
    фраз: c.phrases,
    google: c.google,
    полоса: bandOf(c.google),
    топ_фраза: c.topPhrase,
    ...sig,
    ...v,
  };
});

/* ---------------------------------------------------------------- *
 * Антиканнибализация: два кандидата в страницы с общей выдачей — одна
 * страница. Проверка идёт только по кандидатам: сливаемые в хаб и no_page
 * друг другу не конкуренты.
 * ---------------------------------------------------------------- */

const overlapMin = rules['антиканнибализация']['пересечение_топов'];
const pageLike = new Set(['страница', 'волна_2', 'карта_мест', 'люди_истории']);
const candidates = clusters.filter((c) => pageLike.has(c['судьба']));
const urlSets = new Map(candidates.map((c) => [c['кластер'], new Set(clusterUrls(byCluster.get(c['кластер']) || []))]));

const cannibals = [];
for (let i = 0; i < candidates.length; i++) {
  for (let j = i + 1; j < candidates.length; j++) {
    const a = candidates[i];
    const b = candidates[j];
    const A = urlSets.get(a['кластер']);
    const B = urlSets.get(b['кластер']);
    if (!A.size || !B.size) continue;
    let common = 0;
    for (const u of A) if (B.has(u)) common += 1;
    // Делим на меньший из топов: у кластера с четырьмя адресами и у кластера
    // с десятью общая четвёрка — это полное совпадение первого, а не 40 %.
    const share = common / Math.min(A.size, B.size);
    if (share < overlapMin) continue;
    cannibals.push({
      кластеры: [a['кластер'], b['кластер']],
      google: [a.google, b.google],
      общих_адресов: common,
      топов: [A.size, B.size],
      пересечение: Number(share.toFixed(2)),
      // Топ из трёх адресов даёт «сто процентов» на трёх совпадениях.
      // Такая пара — повод посмотреть, а не доказательство.
      слабое_основание: Math.min(A.size, B.size) < 5,
      рекомендация: 'одна страница: ключи слабого кластера уходят в сильный',
    });
  }
}
cannibals.sort((x, y) => y.google[0] + y.google[1] - (x.google[0] + x.google[1]));

/* ---------------------------------------------------------------- *
 * Судьба некластеризованной фразы.
 * ---------------------------------------------------------------- */

const codeRes = rules['коды_и_артикулы']['образцы'].map((s) => new RegExp(s, 'i'));
const versionRe = new RegExp(rules['коды_и_артикулы']['версии_и_патчи'], 'i');
const themes = rules['серийные_темы'];

function fateOfPhrase(p) {
  const t = p.phrase;
  const alien = hitWord(t, rules['чужие_вселенные']['не_наша_вселенная']);
  if (alien) return { судьба: 'exclusions', причина: `чужая вселенная: «${alien}»`, уверенность: 'high' };

  if (codeRes.some((re) => re.test(t)) || versionRe.test(t)) {
    return { судьба: 'exclusions', причина: 'код, артикул или номер патча — не тема запроса', уверенность: 'high' };
  }

  const cross = hitWord(t, rules['чужие_вселенные']['кроссовер']);
  if (cross) return { судьба: 'no_page', причина: `кроссовер с чужой игрой: «${cross}»`, уверенность: 'medium' };

  const side = hitWord(t, rules['побочные_темы']['имена']);
  if (side) return { судьба: 'no_page', причина: `побочная тема серии: «${side}»`, уверенность: 'high' };

  const shopWord = hitWord(t, shop['слова']);
  if (shopWord) return { судьба: 'no_page', причина: `магазинный интент: «${shopWord}»`, уверенность: 'high' };

  const place = hitWord(t, rules['исторические_места']['имена']);
  if (place) return { судьба: 'новая_тема', цель: 'карта мест', причина: `историческое место: «${place}»`, уверенность: 'high' };

  const person = hitWord(t, rules['исторические_лица']['имена']);
  if (person) return { судьба: 'новая_тема', цель: 'люди истории', причина: `историческое лицо: «${person}»`, уверенность: 'medium' };

  for (const [theme, list] of Object.entries(themes)) {
    if (theme === 'почему') continue;
    const hit = hitWord(t, list);
    if (hit) return { судьба: 'новая_тема', цель: theme, причина: `серийная тема: «${hit}»`, уверенность: 'medium' };
  }

  const hub = hubOf(t);
  if (hub) return { судьба: 'к_кластеру', цель: hub, причина: `тема игры: хаб «${hub}»`, уверенность: 'high' };

  if (/assassin|asasyn|ubisoft|ac /i.test(t)) {
    return {
      судьба: 'к_кластеру',
      цель: 'assassins',
      причина: 'запрос о серии без опознанной темы — ключом на главную, проверить глазами',
      уверенность: 'low',
    };
  }
  return { судьба: 'no_page', причина: 'тема не восстановлена по фразе — проверить глазами', уверенность: 'low' };
}

const unclustered = (byCluster.get(UNCLUSTERED) || []).map((p) => ({
  фраза: p.phrase,
  google: p.google,
  ...fateOfPhrase(p),
}));

/* ---------------------------------------------------------------- *
 * Учёт: каждая фраза ровно один раз.
 * ---------------------------------------------------------------- */

const phrasesIn = (name) => (byCluster.get(name) || []).length;
const tally = { всего: data.phrases.length, по_судьбам: {}, некластеризовано: {} };
for (const c of clusters) {
  tally['по_судьбам'][c['судьба']] = (tally['по_судьбам'][c['судьба']] || 0) + phrasesIn(c['кластер']);
}
for (const u of unclustered) {
  tally['некластеризовано'][u['судьба']] = (tally['некластеризовано'][u['судьба']] || 0) + 1;
}
const counted =
  Object.values(tally['по_судьбам']).reduce((a, b) => a + b, 0) +
  Object.values(tally['некластеризовано']).reduce((a, b) => a + b, 0);
tally['учтено'] = counted;
tally['сходится'] = counted === data.phrases.length;

/* ---------------------------------------------------------------- *
 * Выход.
 * ---------------------------------------------------------------- */

const byVerdict = (v) => clusters.filter((c) => c['судьба'] === v);

const out = {
  инструмент: 'tools/recon-s0.mjs',
  правила: 'structure/rules-s0.json',
  выгрузка: data.meta,
  снимок: { дата: '2026-09-07', движок: 'google', гео: 'PL', язык: 'pl' },
  статус: 'предложение S0 — пачки на подтверждение владельцу',
  хвост: {
    метод: rules['хвост']['метод'],
    голова_доля: rules['хвост']['голова_доля'],
    середина_доля: rules['хвост']['середина_доля'],
    границы: { голова_от: headCut.value, середина_от: midCut.value },
    полосы: {
      голова: { кластеров: headCut.count, объём: headCut.covered },
      середина: { кластеров: midCut.count - headCut.count, объём: midCut.covered - headCut.covered },
      хвост: { кластеров: real.length - midCut.count, объём: totalGoogle - midCut.covered },
    },
    всего: { кластеров: real.length, объём: totalGoogle },
    гистограмма: histogram,
  },
  сводка: {
    страница: byVerdict('страница').length,
    люди_истории: byVerdict('люди_истории').length,
    волна_2: byVerdict('волна_2').length,
    слить_в_хаб: byVerdict('слить_в_хаб').length,
    no_page: byVerdict('no_page').length,
    exclusions: byVerdict('exclusions').length,
    карта_мест: byVerdict('карта_мест').length,
  },
  антиканнибализация: {
    порог: overlapMin,
    пар: cannibals.length,
    пары: cannibals,
  },
  учёт: tally,
  кластеры: clusters,
  некластеризовано: unclustered,
};

if (!dryRun) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n');
}

/* ---------------------------------------------------------------- *
 * Сводка в консоль.
 * ---------------------------------------------------------------- */

const pct = (v) => `${((100 * v) / totalGoogle).toFixed(2)} %`;
console.log(`выгрузка: ${data.meta.phrases} фраз, ${data.meta.clusters} строк кластеров, sha256 ${data.meta.sha256.slice(0, 12)}…`);
console.log(`объём Google по кластерам: ${totalGoogle} (без «${UNCLUSTERED}»)`);
console.log('');
console.log('полосы объёма (границы выведены из распределения):');
console.log(`  голова   ≥ ${headCut.value}/мес — ${headCut.count} кластеров, ${pct(headCut.covered)} объёма`);
console.log(`  середина ≥ ${midCut.value}/мес — ${midCut.count - headCut.count} кластеров, ${pct(midCut.covered - headCut.covered)}`);
console.log(`  хвост    < ${midCut.value}/мес — ${real.length - midCut.count} кластеров, ${pct(totalGoogle - midCut.covered)}`);
console.log('');
console.log('гистограмма (кластеров в полосе):');
for (const b of histogram) {
  const label = `${b['от']}–${b['до'] ?? '∞'}`.padStart(12);
  console.log(`  ${label} ${String(b['кластеров']).padStart(4)}  ${'#'.repeat(Math.round(b['кластеров'] / 2))}`);
}
console.log('');
console.log('судьбы кластеров:');
for (const [k, v] of Object.entries(out['сводка'])) console.log(`  ${k.padEnd(14)} ${String(v).padStart(4)}`);
console.log('');
console.log(`пар с пересечением топов ≥ ${Math.round(overlapMin * 100)} % среди кандидатов: ${cannibals.length}`);
for (const p of cannibals.slice(0, 8)) {
  console.log(`  ${p['кластеры'][0]} × ${p['кластеры'][1]} — ${p['общих_адресов']} общих, ${Math.round(p['пересечение'] * 100)} %`);
}
console.log('');
console.log(`некластеризованных фраз: ${unclustered.length}`);
for (const [k, v] of Object.entries(tally['некластеризовано'])) console.log(`  ${k.padEnd(14)} ${String(v).padStart(4)}`);
console.log('');
console.log(`учёт: ${tally['учтено']} из ${tally['всего']} — ${tally['сходится'] ? 'сходится' : 'НЕ СХОДИТСЯ'}`);
if (!dryRun) console.log(`записано: structure/s0-recon.json`);
if (!tally['сходится']) process.exit(1);
