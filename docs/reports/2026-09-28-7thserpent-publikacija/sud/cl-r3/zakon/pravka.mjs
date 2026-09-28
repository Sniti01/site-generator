// Набросок правки (не в репозиторий): копия инструмента под судом с правками CL3-Z, по выбору.
//   z1 — сверка HTML со сборкой после нормализации cid и хешей имён CSS (как sverka-dist сторожа, SV1-Z-1), справка;
//   z2 — у «HTML отличается от сборки» — первое расхождение (фрагменты сборки и сайта), причина без «вставки»;
//   z3 — ограничения блока хостера — по делу: правило, закрывающее путь сборки (прочее — справка); bingbot → msnbot.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SAYT, ZDES } from './stend.mjs';

const ISKH = readFileSync(`${SAYT}/tools/check-live.mjs`, 'utf8');

function zamenit(t, iz, na) {
  const n = t.split(iz).length - 1;
  if (n !== 1) throw new Error(`правка: образец встречается ${n} раз: ${iz.slice(0, 80)}`);
  return t.replace(iz, () => na);
}

const PRAVKI = {
  z1: [
    [
      "const norm = (s) =>",
      "/** HTML сборки без того, что зависит от машины сборки (SV1-Z-1): значения data-astro-cid — метками по порядку, хеш в имени _astro/*.css снят. */\nconst normSborki = (html) => {\n  const cid = new Map();\n  return html\n    .replace(/data-astro-cid-([a-z0-9]+)/g, (_, v) => {\n      if (!cid.has(v)) cid.set(v, cid.size + 1);\n      return `data-astro-cid-#${cid.get(v)}`;\n    })\n    .replace(/(_astro\\/[^/\"'()\\s]+?)\\.[A-Za-z0-9_-]{8}\\.css/g, '$1.#.css');\n};\nconst norm = (s) =>",
    ],
    [
      "    if (nasha !== null && nasha === r.telo) continue;\n",
      "    if (nasha !== null && nasha === r.telo) continue;\n    if (nasha !== null && normSborki(nasha) === normSborki(r.telo)) {\n      drugayaMashina.push(kratko(u));\n      continue;\n    }\n",
    ],
    ["  const raznye = [];\n", "  const raznye = [];\n  const drugayaMashina = [];\n"],
    [
      "  const sto = svoi.filter(([, r]) => r.status === 200);\n",
      "  if (drugayaMashina.length) spravki.push(`HTML = сборка после нормализации cid ядра и хешей имён CSS (сборка другой машины, SV1-Z-1): ${drugayaMashina.length} стр.`);\n  const sto = svoi.filter(([, r]) => r.status === 200);\n",
    ],
  ],
  z2: [
    [
      "const norm = (s) =>",
      "/** Первое расхождение двух текстов: позиция и фрагменты. */\nconst pervoeRaskhozhdenie = (a, b) => {\n  let i = 0;\n  while (i < a.length && a[i] === b[i]) i += 1;\n  const kusok = (t) => t.slice(Math.max(0, i - 20), i + 40).replace(/\\s+/g, ' ');\n  return `с знака ${i}: сборка «${kusok(a)}», сайт «${kusok(b)}»`;\n};\nconst norm = (s) =>",
    ],
    [
      "vstavka ? vstavka[1] : 'HTML отличается от сборки'}`);",
      "vstavka ? vstavka[1] : `HTML отличается от сборки ${typeof normSborki === 'function' ? pervoeRaskhozhdenie(normSborki(nasha), normSborki(r.telo)) : pervoeRaskhozhdenie(nasha, r.telo)}`}`);",
    ],
    [
      "raznye.length ? `${raznye.slice(0, 3).join(' | ')} — /privacy/ обещает: два своих скрипта, запросов наружу нет`",
      "raznye.length ? `${raznye.slice(0, 3).join(' | ')} — вставка на пути (Cloudflare, хостер) или dist/ собран не из выложенного коммита; /privacy/ обещает: два своих скрипта, запросов наружу нет`",
    ],
  ],
  z4: [
    [
      "  const fajly = obhod(dist).map((f) => relative(dist, f).replace(/\\\\/g, '/'));",
      "  // Служебные файлы сервера (`.htaccess`) — не адреса сайта: сервер их не отдаёт (403), роботам они не нужны.\n  const fajly = obhod(dist).map((f) => relative(dist, f).replace(/\\\\/g, '/')).filter((f) => !f.split('/').some((c) => c.startsWith('.')));",
    ],
  ],
  z5: [
    [
      "/** Группы файла как у robots.cc:",
      "/** Строка копии robots.txt вне нашего файла, которая сама вреда не несёт: User-agent, Allow, пустой Disallow, Sitemap на хост\n *  сайта (прежняя редакция нашего файла в кэше Cloudflare). Запреты и неизвестные ключи — вред (судятся как раньше). */\nconst bezvrednayaStroka = (s, golyy) => {\n  const d = s.indexOf(':');\n  if (d < 0) return false;\n  const [k, v] = [s.slice(0, d).trim(), s.slice(d + 1).trim()];\n  const vid = klyuch(k);\n  if (vid === 'ua' || vid === 'allow' || (vid === 'disallow' && v === '')) return true;\n  if (/^sitemap$/i.test(k)) {\n    try {\n      return new URL(v).host.replace(/^www\\./, '') === golyy;\n    } catch {\n      return false;\n    }\n  }\n  return false;\n};\n/** Группы файла как у robots.cc:",
    ],
    ["      ...rbBez.chuzhoyTekst,\n", "      ...rbBez.chuzhoyTekst.filter((s) => !bezvrednayaStroka(s, golyy)),\n"],
  ],
  z3: [
    ["bingbot: ['bingbot'] };", "bingbot: ['bingbot', 'msnbot'] };"],
    ["export function razobratRobots(telo, nash) {", "export function razobratRobots(telo, nash, puti = null) {"],
    [
      "      const zaprety = g.pravila.filter((p) => !p.allow && p.put !== '');\n      if (komu.length && zaprety.length) ogranicheniya.push(",
      "      const zaprety = g.pravila.filter((p) => !p.allow && p.put !== '' && (!puti || puti.some((x) => sovpadaet(p.put, x))));\n      const vne = puti ? g.pravila.filter((p) => !p.allow && p.put !== '' && !puti.some((x) => sovpadaet(p.put, x))) : [];\n      if (komu.length && vne.length) sluzhebnye.push(`«${b.imya}»: ${komu.join(', ')} — Disallow: ${vne.map((p) => p.put).join(', ')}`);\n      if (komu.length && zaprety.length) ogranicheniya.push(",
    ],
    ["  const ogranicheniya = [];\n  for (const b of bloki", "  const ogranicheniya = [];\n  const sluzhebnye = [];\n  for (const b of bloki"],
    ["    ogranicheniya,\n  };\n}", "    ogranicheniya,\n    sluzhebnye,\n  };\n}"],
    ["const rb = mimo.status === 200 ? razobratRobots(mimo.telo, nashRobots) : null;", "const rb = mimo.status === 200 ? razobratRobots(mimo.telo, nashRobots, PUTI) : null;"],
    ["const rbBez = razobratRobots(bez.telo, nashRobots);", "const rbBez = razobratRobots(bez.telo, nashRobots, PUTI);"],
    [
      "  for (const k of rb ? rb.kommentarii : [])",
      "  for (const z of rb ? rb.sluzhebnye : []) spravki.push(`robots.txt: блок запрещает пути вне сборки — ${z} (ни одного пути сборки не закрывает)`);\n  for (const k of rb ? rb.kommentarii : [])",
    ],
  ],
};

let schet = 0;
/** Модуль копии инструмента с правками `imena` (массив из z1, z2, z3). */
export async function sPravkami(imena) {
  let t = ISKH;
  for (const i of imena) for (const [iz, na] of PRAVKI[i]) t = zamenit(t, iz, na);
  const f = `${ZDES}/check-live-pravka-${imena.join('-') || 'bez'}.mjs`;
  writeFileSync(f, t);
  schet += 1;
  return import(`${pathToFileURL(f).href}?v=${schet}`);
}
