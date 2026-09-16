// Сериализатор games.json в стиле файла (CRLF): эпохи — многострочно; keyart без zrzuty — одной строкой;
// записи с zrzuty — многострочно, каждый элемент zrzuty — одной строкой.
// Использование: import { serialize, check } from './games-ser.mjs'
import { readFileSync, writeFileSync } from 'node:fs';

const compact = (o) => '{ ' + Object.entries(o).map(([k, v]) => JSON.stringify(k) + ': ' + JSON.stringify(v)).join(', ') + ' }';

export function serialize(m) {
  const L = [];
  L.push('{');
  L.push(`  "_": ${JSON.stringify(m._)},`);
  L.push('  "hero": {');
  const hk = Object.entries(m.hero);
  hk.forEach(([k, v], i) => L.push(`    ${JSON.stringify(k)}: ${JSON.stringify(v)}${i < hk.length - 1 ? ',' : ''}`));
  L.push('  },');
  L.push('  "games": [');
  m.games.forEach((g, gi) => {
    const last = gi === m.games.length - 1;
    const hasZ = Array.isArray(g.zrzuty) && g.zrzuty.length;
    if (g.slot && !hasZ) {
      L.push(`    ${compact(g)}${last ? '' : ','}`);
      return;
    }
    L.push('    {');
    const keys = Object.entries(g);
    keys.forEach(([k, v], ki) => {
      const comma = ki < keys.length - 1 ? ',' : '';
      if (k === 'zrzuty') {
        L.push(`      "zrzuty": [`);
        v.forEach((z, zi) => L.push(`        ${compact(z)}${zi < v.length - 1 ? ',' : ''}`));
        L.push(`      ]${comma}`);
      } else {
        L.push(`      ${JSON.stringify(k)}: ${JSON.stringify(v)}${comma}`);
      }
    });
    L.push(`    }${last ? '' : ','}`);
  });
  L.push('  ],');
  const rest = Object.entries(m).filter(([k]) => !['_', 'hero', 'games'].includes(k));
  rest.forEach(([k, v], i) => L.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)}${i < rest.length - 1 ? ',' : ''}`));
  L.push('}');
  return L.join('\r\n') + '\r\n';
}

export function check(path) {
  const raw = readFileSync(path, 'utf8');
  const re = serialize(JSON.parse(raw));
  return { equal: re === raw, raw, re };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('games-ser.mjs') && process.argv[2]) {
  const r = check(process.argv[2]);
  console.log('roundtrip equal:', r.equal);
  if (!r.equal) {
    const a = r.raw.split('\r\n'), b = r.re.split('\r\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { console.log('line', i + 1, '\n  raw:', a[i], '\n  ser:', b[i]); break; }
  }
}
