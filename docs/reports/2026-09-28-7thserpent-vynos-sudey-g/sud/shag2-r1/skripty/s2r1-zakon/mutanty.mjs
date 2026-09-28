// Мутанты правки 3b96e41 — в своей папке; репозиторий только читается.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const R = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const TU = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/s2r1/s2r1-zakon';
const u = (p) => pathToFileURL(p).href;
const zam = (s, iz, na) => {
  if (!s.includes(iz)) throw new Error('нет образца: ' + iz.slice(0, 80));
  return s.split(iz).join(na);
};

// Данные сверки — список обратно из двух.
writeFileSync(`${TU}/gates-dva.mjs`, "export const OBYAZATELNAYA_PODPIS = ['/remake/', '/movie/'];\n");

// Судья-мутант: список обязательных подписей зашит, параметр obyazatelnaPodpis не читается.
const req = createRequire(`${R}/tools/sverka.mjs`);
let sud = readFileSync(`${R}/tools/sverka.mjs`, 'utf8');
sud = zam(sud, "from 'yaml'", `from '${u(req.resolve('yaml'))}'`);
sud = zam(sud, "from '@factory/core/text/html.mjs'", `from '${u(req.resolve('@factory/core/text/html.mjs'))}'`);
sud = zam(sud, 'if (obyazatelnaPodpis.has(page.url) && !dane.artCaption)', "if (new Set(['/remake/', '/movie/', '/media/', '/mods/', '/quotes/', '/voice-and-face/']).has(page.url) && !dane.artCaption)");
writeFileSync(`${TU}/sudya-zashit.mjs`, sud);

const test = readFileSync(`${R}/tools/testy/sverka.test.mjs`, 'utf8');
const pod = (sudya, gates) => {
  let t = zam(test, "from '../sverka.mjs'", `from '${sudya}'`);
  t = zam(t, "from './obshchee.mjs'", `from '${u(`${R}/tools/testy/obshchee.mjs`)}'`);
  return zam(t, "from '../../gates/sverka.mjs'", `from '${gates}'`);
};
// m1: данные сверки из двух — ждём красного.
writeFileSync(`${TU}/m1-dva.test.mjs`, pod(u(`${R}/tools/sverka.mjs`), u(`${TU}/gates-dva.mjs`)));
// m2: судья с зашитым списком — краснеет ли что-нибудь?
writeFileSync(`${TU}/m2-zashit.test.mjs`, pod(u(`${TU}/sudya-zashit.mjs`), u(`${R}/gates/sverka.mjs`)));
// m3: судья с зашитым списком, данные из двух — краснеет ли?
writeFileSync(`${TU}/m3-zashit-dva.test.mjs`, pod(u(`${TU}/sudya-zashit.mjs`), u(`${TU}/gates-dva.mjs`)));
console.log('готово');
