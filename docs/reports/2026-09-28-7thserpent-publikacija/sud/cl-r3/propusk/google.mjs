// Модель разборщика Google — перенос RobotsMatcher из github.com/google/robotstxt (robots.cc), как у скептика раунда 2
// (sud/cl-r2/propusk/obshchee.mjs), плюс признак «есть своя группа» для цепочки Googlebot-Image → Googlebot → *.
const WS = /^[ \t\n\v\f\r]+|[ \t\n\v\f\r]+$/g;
function matches(path, pattern) {
  const n = path.length;
  let pos = [0];
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '$' && i + 1 === pattern.length) return pos[pos.length - 1] === n;
    if (c === '*') {
      const out = [];
      for (let p = pos[0]; p <= n; p++) out.push(p);
      pos = out;
    } else {
      pos = pos.filter((p) => p < n && path[p] === c).map((p) => p + 1);
      if (!pos.length) return false;
    }
  }
  return true;
}
const escapePattern = (v) => v.replace(/%([0-9a-f]{2})/gi, (_, h) => '%' + h.toUpperCase()).replace(/[^\x00-\x7f]/gu, (ch) => [...Buffer.from(ch, 'utf8')].map((b) => '%' + b.toString(16).toUpperCase().padStart(2, '0')).join(''));

/** `{ razreshen, svoya }` — разрешён ли путь агенту и была ли в файле его собственная группа. */
export function googleRazbor(txt, agent, path) {
  let seenGlobal = false, seenSpecific = false, everSpecific = false, seenSep = false;
  const allow = { g: -1, s: -1 }, dis = { g: -1, s: -1 };
  for (let line of txt.replace(/^﻿/, '').split(/\r\n|\r|\n/)) {
    const h = line.indexOf('#');
    if (h >= 0) line = line.slice(0, h);
    line = line.replace(WS, '');
    if (!line) continue;
    let key, val;
    const c = line.indexOf(':');
    if (c >= 0) {
      key = line.slice(0, c);
      val = line.slice(c + 1);
    } else {
      const m = /[ \t]/.exec(line);
      if (!m) continue;
      const rest = line.slice(m.index).replace(/^[ \t]+/, '');
      if (/[ \t]/.test(rest)) continue;
      key = line.slice(0, m.index);
      val = rest;
    }
    key = key.replace(WS, '');
    if (!key) continue;
    val = val.replace(WS, '');
    const k = key.toLowerCase();
    const isUA = ['user-agent', 'useragent', 'user agent'].some((t) => k.startsWith(t));
    const isAllow = !isUA && k.startsWith('allow');
    const isDis = !isUA && !isAllow && ['disallow', 'dissallow', 'dissalow', 'disalow', 'diasllow', 'disallaw'].some((t) => k.startsWith(t));
    if (isUA) {
      if (seenSep) seenSpecific = seenGlobal = seenSep = false;
      if (val.length >= 1 && val[0] === '*' && (val.length === 1 || /\s/.test(val[1]))) seenGlobal = true;
      else if ((/^[A-Za-z_-]*/.exec(val)[0]).toLowerCase() === agent.toLowerCase()) seenSpecific = everSpecific = true;
    } else if (isAllow || isDis) {
      if (!(seenGlobal || seenSpecific)) continue;
      seenSep = true;
      const pat = escapePattern(val);
      const pr = matches(path, pat) ? pat.length : -1;
      if (pr < 0) continue;
      const t = isAllow ? allow : dis;
      if (seenSpecific) t.s = Math.max(t.s, pr);
      else t.g = Math.max(t.g, pr);
    }
  }
  let razreshen = true;
  if (allow.s > 0 || dis.s > 0) razreshen = !(dis.s > allow.s);
  else if (everSpecific) razreshen = true;
  else if (dis.g > 0 || allow.g > 0) razreshen = !(dis.g > allow.g);
  return { razreshen, svoya: everSpecific };
}
export const google = (txt, agent, path) => googleRazbor(txt, agent, path).razreshen;
/** Googlebot-Image: своя группа, иначе группа Googlebot, иначе * (правила Google для краулеров с запасным токеном). */
export function googleImage(txt, path) {
  const a = googleRazbor(txt, 'googlebot-image', path);
  if (a.svoya) return a.razreshen;
  return googleRazbor(txt, 'googlebot', path).razreshen;
}
