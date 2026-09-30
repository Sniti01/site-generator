// Сверка утверждений шапки check-live (коммит 1480f7e) с кодом и образцами — на копии вне репозитория.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-cl25-shapka';
const SAYT = join(PAPKA, 'k-1480f7e/sites/7thserpent.com');
const CL = await import(pathToFileURL(join(SAYT, 'tools/check-live.mjs')).href);
const CC = await import(pathToFileURL(join(PAPKA, 'k-1480f7e/docs/reports/2026-09-30-7thserpent-razmorozka/sud/cl25/propusk/robots-cc.mjs')).href);
const nash = readFileSync(join(SAYT, 'public/robots.txt'), 'utf8');
const struktura = JSON.parse(readFileSync(join(SAYT, 'structure/structure.json'), 'utf8'));
const O24 = JSON.parse(readFileSync(join(SAYT, 'tools/testy/obrazec-khostera.json'), 'utf8'));
const O25 = JSON.parse(readFileSync(join(SAYT, 'tools/testy/obrazec-vladelca.json'), 'utf8'));
const sha = (t) => createHash('sha256').update(Buffer.from(t, 'utf8')).digest('hex');
const B = 'https://www.7thserpent.com';
const PUTI = [...struktura.pages.map((x) => x.url), '/_astro/index.Cz6femgl.css', '/_astro/hero.webp', '/favicon.svg', '/robots.txt', '/sitemap-index.xml', '/sitemap-0.xml'];
const HOSTER = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n';
const out = [];
const p = (...a) => out.push(a.join(' '));
const zag = (o) => Object.fromEntries(o.zagolovki ?? []);
const KESH = ['age', 'x-cache', 'x-cache-status', 'via', 'cf-cache-status', 'cf-ray'];

p('== 1. Образцы: что записано байтами ==');
p('obrazec-khostera.json, ключи:', Object.keys(O24).join(', '));
const otv = Object.entries(O24.otvety);
const sTelom = otv.filter(([, o]) => typeof o.telo === 'string');
p(`  ответов прогона 1: ${otv.length}; с телом: ${sTelom.length} — ${sTelom.map(([u]) => u.replace(B, '')).join(', ')}`);
const bezTela = otv.filter(([, o]) => typeof o.telo !== 'string');
p(`  без тела: ${bezTela.length}; поля у них: ${[...new Set(bezTela.flatMap(([, o]) => Object.keys(o)))].join(', ')}`);
for (const [u, o] of sTelom) p(`  ${u.replace(B, '')}: ${o.status}, ${Buffer.byteLength(o.telo)} байт, sha256 записан = посчитан: ${o.sha256 === sha(o.telo)}; кэш-заголовки: ${KESH.filter((k) => k in zag(o)).join(', ') || 'нет'}`);
p(`  пар robots.txt: ${O24.robotsPary.length}`);
for (const para of O24.robotsPary) p(`  пара ${para.para}: тела с параметром и без равны — ${para.s.telo === para.bez.telo}; ${Buffer.byteLength(para.s.telo)} байт; кэш-заголовки: ${KESH.filter((k) => k in zag(para.s) || k in zag(para.bez)).join(', ') || 'нет'}`);
const s1 = O24.otvety[`${B}/robots.txt?live-check=${O24.metka}`];
const b1 = O24.otvety[`${B}/robots.txt`];
p(`  прогон 1: тела с параметром и без равны — ${s1.telo === b1.telo}`);
p('obrazec-vladelca.json, ключи:', Object.keys(O25).join(', '));
for (const para of O25.robotsPary) p(`  пара ${para.para}: тела равны — ${para.s.telo === para.bez.telo}; ${Buffer.byteLength(para.s.telo)} байт; = public/robots.txt — ${para.s.telo === nash}; кэш-заголовки: ${KESH.filter((k) => k in zag(para.s) || k in zag(para.bez)).join(', ') || 'нет'}`);

p('\n== 2. Блоки в образцах (razobratRobots копии) ==');
const KONEC = '# END adm.tools Managed content\n\n';
const PREZHNIY = s1.telo.slice(s1.telo.indexOf(KONEC) + KONEC.length);
const BLOK24 = s1.telo.slice(0, s1.telo.length - PREZHNIY.length);
const r24 = CL.razobratRobots(s1.telo, PREZHNIY, PUTI);
p(`сессия 24 против прежнего файла: nashCelikom ${r24.nashCelikom}; bloki ${JSON.stringify(r24.bloki)}; чужое ${r24.chuzhoyTekst.length}; ограничений ${r24.ogranicheniya.length}; блок ${Buffer.byteLength(BLOK24)} байт`);
const r25 = CL.razobratRobots(O25.robotsPary[0].s.telo, nash, PUTI);
p(`сессия 25 против файла владельца: nashCelikom ${r25.nashCelikom}; bloki ${JSON.stringify(r25.bloki)}; чужое ${r25.chuzhoyTekst.length}`);

p('\n== 3. Файл владельца по порту robots.cc ==');
const BOTY = ['AhrefsBot', 'MJ12bot', 'DataForSeoBot', 'barkrowler', 'Bytespider', 'meta-externalagent', 'Baiduspider', 'meta-webindexer', 'AhrefsSiteAudit', 'SemrushBot', 'serpstatbot', 'GPTBot', 'ClaudeBot', 'Googlebot', 'Bingbot'];
const zakr = BOTY.filter((b) => CC.robotsCc(nash, [b], '/', { shirokiy: true }).zakryto);
p(`закрыты на /: ${zakr.length} — ${zakr.join(', ')}`);
p(`строк Allow: ${nash.split('\n').filter((s) => /^allow:/i.test(s)).join(' | ')}`);

p('\n== 4. CL25-P-1: живой блок сессии 24 перед файлом владельца ==');
const tP1 = BLOK24 + nash;
const rP1 = CL.razobratRobots(tP1, nash, PUTI);
p(`проверка 3: наш файл целиком ${rP1.nashCelikom}; чужое ${rP1.chuzhoyTekst.length}; блоки ${JSON.stringify(rP1.bloki)}; ограничений ${rP1.ogranicheniya.length}; поисковикам закрыто ${CL.zakrytoPoiskovikam(tP1, PUTI).length}`);
p(`GPTBot по порту: файл владельца — ${CC.robotsCc(nash, ['GPTBot'], '/').zakryto ? 'закрыт' : 'открыт'}; блок + файл — ${CC.robotsCc(tP1, ['GPTBot'], '/').zakryto ? 'закрыт' : 'открыт'}`);

p('\n== 5. CL25-P-5: какие пробелы разбор снимает шире robots.cc (строка в блоке после файла владельца, затем Disallow: /*) ==');
const formy = [
  ['\\v в начале строки', '\u000bUser-agent: Foo'],
  ['\\f в начале строки', '\u000cUser-agent: Foo'],
  ['\\v вместо двоеточия (разделитель)', 'User-agent\u000bFoo'],
  ['NBSP в начале строки', '\u00a0User-agent: Foo'],
  ['BOM в начале строки', '\ufeffUser-agent: Foo'],
  ['NBSP вместо двоеточия (разделитель)', 'User-agent\u00a0Foo'],
  ['контроль: обычная строка', 'User-agent: Foo'],
];
for (const [imya, stroka] of formy) {
  const telo = `${nash}\n# BEGIN adm.tools Managed content\n${stroka}\nDisallow: /*\n# END adm.tools Managed content\n`;
  const rb = CL.razobratRobots(telo, nash, PUTI);
  const clZ = CL.zakrytoPoiskovikam(telo, PUTI).length;
  const ccZ = CC.zakrytoCc(telo, PUTI).length;
  p(`${imya}: check-live — поисковикам закрыто ${clZ}, ограничений ${rb.ogranicheniya.length}; порт robots.cc — закрыто ${ccZ} → ${clZ === ccZ && (rb.ogranicheniya.length > 0) === (ccZ > 0) ? 'совпадают' : 'РАСХОДЯТСЯ'}`);
}

p('\n== 6. CL25-Z-5: разница только пробелами — что печатает указатель «наш файл целиком» ==');
const zamena = (t, iz, na) => {
  if (!t.includes(iz)) throw new Error(`нет «${iz}»`);
  return t.replace(iz, na);
};
const varianty = [
  ['пробел в конце строки', zamena(nash, 'Allow: /\n', 'Allow: / \n')],
  ['таб в начале строки', zamena(nash, 'User-agent: Googlebot', '\tUser-agent: Googlebot')],
  ['NBSP в начале строки', zamena(nash, 'User-agent: Googlebot', '\u00a0User-agent: Googlebot')],
  ['два пробела внутри строки', zamena(nash, 'User-Agent: MJ12bot', 'User-Agent:  MJ12bot')],
  ['таб вместо пробела внутри строки', zamena(nash, 'User-Agent: MJ12bot', 'User-Agent:\tMJ12bot')],
  ['лишняя пустая строка между группами', zamena(nash, 'Disallow: /\n\nUser-Agent: MJ12bot', 'Disallow: /\n\n\nUser-Agent: MJ12bot')],
  ['пустой строки между группами нет', zamena(nash, 'Disallow: /\n\nUser-Agent: MJ12bot', 'Disallow: /\nUser-Agent: MJ12bot')],
  ['переводы строки в конце', `${nash}\n\n`],
  ['CRLF', nash.replace(/\n/g, '\r\n')],
];
for (const [imya, v] of varianty) {
  for (const [s, telo] of [['без блока', v], ['с блоком', HOSTER + v]]) {
    const rb = CL.razobratRobots(telo, nash, PUTI);
    p(`${imya}, ${s}: наш файл целиком ${rb.nashCelikom}${rb.nashCelikom ? '' : `; указатель: ${rb.raskhozhdenie}`}`);
  }
}

p('\n== 7. Имена блоков: хостер, чужой, Cloudflare ==');
for (const imya of ['adm.tools', 'ADM.TOOLS', 'Yoast', 'Cloudflare', 'adm.tools hosting']) {
  const rb = CL.razobratRobots(`# BEGIN ${imya} Managed content\nUser-agent: X\nDisallow: /\n# END ${imya} Managed content\n\n${nash}`, nash, PUTI);
  p(`«${imya}»: ${JSON.stringify(rb.bloki.map((b) => b.vid))}`);
}

writeFileSync(join(PAPKA, 'proba-shapki-vyvod.txt'), `${out.join('\n')}\n`);
console.log(out.join('\n'));
