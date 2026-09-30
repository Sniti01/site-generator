// Независимый порт разбора robots.txt по google/robotstxt (robots.cc) — чтобы судить check-live не его же кодом.
// Построчно, как RobotsMatcher: HandleUserAgent / HandleAllow / HandleDisallow, seen_separator_, ever_seen_specific_agent_;
// ключи — по началу слова без учёта регистра ASCII, опечатки как kAllowFrequentTypos; строка без двоеточия — ровно два
// слова через пробел или таб; пробелы — только ASCII (StripAsciiWhitespace); значение правила — MaybeEscapePattern
// (не-ASCII — %XX); приоритет правила — длина образца; при равенстве Allow (disallow() — строго больше).
// Выбор группы для бота с цепочкой (Googlebot-Image → Googlebot, Bingbot → msnbot) — «самая точная группа»
// (документация Google: Order of precedence for user agents; Bing — группа msnbot для bingbot).

const WS = new Set([' ', '\t', '\n', '\v', '\f', '\r']);
const strip = (s) => {
  let a = 0;
  let b = s.length;
  while (a < b && WS.has(s[a])) a += 1;
  while (b > a && WS.has(s[b - 1])) b -= 1;
  return s.slice(a, b);
};
const asciiLower = (s) => s.replace(/[A-Z]/g, (c) => c.toLowerCase());
const nachaloCI = (s, p) => asciiLower(s.slice(0, p.length)) === p;

function klyuchZnachenie(line) {
  const r = line.indexOf('#');
  const s = strip(r >= 0 ? line.slice(0, r) : line);
  let k;
  let v;
  const d = s.indexOf(':');
  if (d >= 0) {
    k = s.slice(0, d);
    v = s.slice(d + 1);
  } else {
    const m = /[ \t]/.exec(s);
    if (!m) return null;
    let j = m.index;
    while (j < s.length && (s[j] === ' ' || s[j] === '\t')) j += 1;
    const ostatok = s.slice(j);
    if (/[ \t]/.test(ostatok)) return null;
    k = s.slice(0, m.index);
    v = ostatok;
  }
  k = strip(k);
  if (!k.length) return null;
  return { k, v: strip(v) };
}

function vid(k) {
  if (nachaloCI(k, 'user-agent') || nachaloCI(k, 'useragent') || nachaloCI(k, 'user agent')) return 'ua';
  if (nachaloCI(k, 'allow')) return 'allow';
  if (['disallow', 'dissallow', 'dissalow', 'disalow', 'diasllow', 'disallaw'].some((p) => nachaloCI(k, p))) return 'disallow';
  if (nachaloCI(k, 'sitemap')) return 'sitemap';
  return 'drugoe';
}

function ekranirovat(v) {
  let out = '';
  for (const b of Buffer.from(v, 'utf8')) {
    if (b >= 0x80) out += `%${b.toString(16).toUpperCase().padStart(2, '0')}`;
    else out += String.fromCharCode(b);
  }
  return out.replace(/%([0-9a-f]{2})/gi, (_, h) => `%${h.toUpperCase()}`);
}

function sovpadaet(put, obrazec) {
  let pos = [0];
  for (let i = 0; i < obrazec.length; i += 1) {
    const c = obrazec[i];
    if (c === '$' && i + 1 === obrazec.length) return pos[pos.length - 1] === put.length;
    if (c === '*') {
      const nov = [];
      for (let x = pos[0]; x <= put.length; x += 1) nov.push(x);
      pos = nov;
    } else {
      pos = pos.filter((x) => x < put.length && put[x] === c).map((x) => x + 1);
      if (!pos.length) return false;
    }
  }
  return true;
}

const izvlech = (ua, shirokiy) => (shirokiy ? /^[A-Za-z0-9_-]*/ : /^[A-Za-z_-]*/).exec(ua)[0];
const probel = (c) => WS.has(c);

/** Решение robots.cc для набора имён бота `agenty` и пути: { zakryto, videlSvoyu }. `shirokiy` — для ботов не Google
 *  с цифрами в имени (MJ12bot): имя в строке берётся с цифрами (robots.cc Google берёт только [A-Za-z_-]). */
export function robotsCc(telo, agenty, put, { shirokiy = false } = {}) {
  let t = telo.replace(/^﻿/, '');
  const stroki = t.split(/\r\n|\r|\n/);
  let seenGlobal = false;
  let seenSpecific = false;
  let everSpecific = false;
  let separator = false;
  const pr = { allowS: -1, disS: -1, allowG: -1, disG: -1 };
  const imena = agenty.map((a) => asciiLower(a));
  for (const line of stroki) {
    const kv = klyuchZnachenie(line);
    if (!kv) continue;
    const tip = vid(kv.k);
    if (tip === 'ua') {
      if (separator) {
        seenSpecific = false;
        seenGlobal = false;
        separator = false;
      }
      const ua = kv.v;
      if (ua.length >= 1 && ua[0] === '*' && (ua.length === 1 || probel(ua[1]))) seenGlobal = true;
      else if (imena.includes(asciiLower(izvlech(ua, shirokiy)))) {
        seenSpecific = true;
        everSpecific = true;
      }
    } else if (tip === 'allow' || tip === 'disallow') {
      if (!(seenGlobal || seenSpecific)) continue;
      separator = true;
      const obrazec = ekranirovat(kv.v);
      const prioritet = sovpadaet(put, obrazec) ? obrazec.length : -1;
      if (prioritet < 0) continue;
      const kl = `${tip === 'allow' ? 'allow' : 'dis'}${seenSpecific ? 'S' : 'G'}`;
      if (pr[kl] < prioritet) pr[kl] = prioritet;
    }
  }
  let zakryto;
  if (pr.allowS > 0 || pr.disS > 0) zakryto = pr.disS > pr.allowS;
  else if (everSpecific) zakryto = false;
  else if (pr.disG > 0 || pr.allowG > 0) zakryto = pr.disG > pr.allowG;
  else zakryto = false;
  return { zakryto, videlSvoyu: everSpecific };
}

/** Решение для бота с цепочкой «самой точной группы»: googlebot-image → googlebot; bingbot → msnbot. */
const TSEP = { 'googlebot-image': ['googlebot-image', 'googlebot'], bingbot: ['bingbot', 'msnbot'] };
export function zakrytDlya(telo, bot, put) {
  const tsep = TSEP[bot] ?? [bot];
  for (const [i, imya] of tsep.entries()) {
    const r = robotsCc(telo, [imya], put);
    if (r.videlSvoyu || i === tsep.length - 1) return r.zakryto;
  }
  return false;
}

/** Что закрыто поисковикам по robots.cc: «бот путь». */
export function zakrytoCc(telo, puti) {
  return ['googlebot', 'googlebot-image', 'bingbot'].flatMap((bot) => puti.filter((p) => zakrytDlya(telo, bot, p)).map((p) => `${bot} ${p}`));
}
