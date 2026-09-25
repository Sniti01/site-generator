// Регулярка cta.href из схемы сайта — на наборе адресов (раунд 1, R1-MARSHRUT-1, R1-ZAM-9).
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const src = readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/src/content.config.ts', 'utf8').match(/href: z\.string\(\)\.regex\((\/.*\/)\)/)[1];
const re = new Function('return ' + src)();
const { klasyfikujHref } = await import(pathToFileURL('D:/SEO/cloud/site-generator/core/gates/links.mjs').href);
console.log('регулярка из файла:', src);
const nabor = [
  ['/mods/', 1], ['/', 1], ['/max-payne-1/', 1], ['https://www.youtube.com/rockstargames', 1],
  ['//evil.example/x', 0], ['/\\evil.example/', 0], ['https://', 0], ['https:///mods/', 0], ['https://\\evil', 0],
  ['http://x.com/', 0], ['javascript:alert(1)', 0], ['mods/', 0], ['/ mods/', 0], [' /mods/', 0], ['/mods/\u00a0', 0],
];
let plokho = 0;
for (const [u, zhdem] of nabor) {
  const t = re.test(u) ? 1 : 0;
  if (t !== zhdem) plokho++;
  const k = klasyfikujHref(u, 'https://www.7thserpent.com');
  console.log(`${t === zhdem ? 'ok   ' : 'ПЛОХО'} ${JSON.stringify(u).padEnd(42)} схема ${t ? 'пропускает' : 'отвергает '}  links: ${k.rodzaj}${k.adres ? ' ' + k.adres : ''}`);
}
console.log(plokho ? `ПЛОХО: ${plokho}` : 'все адреса — как ждали');
process.exit(plokho ? 1 : 0);
