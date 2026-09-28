// Z-1: хук сторожа судит своим списком. node opyt-khuk.mjs <net|khuk>
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
const rezhim = process.argv[2] ?? 'net';
register(new URL('./kryuk.mjs', import.meta.url).href, { data: { rezhim } });
const { default: sverka, SAYT } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs');
const { OBYAZATELNAYA_PODPIS } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/gates/sverka.mjs');
const { default: konfig } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/astro.config.mjs');
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28/';
const logger = { error: (s) => console.log('logger.error:', s), info: (s) => console.log('logger.info:', s.slice(0, 60)) };
const prognat = (integ, imya) => {
  integ.hooks['astro:config:done']({ config: { root: pathToFileURL(SAYT + '/') } });
  try {
    integ.hooks['astro:build:done']({ dir: pathToFileURL(DIST), logger });
    console.log(`${imya}: сборка ЗЕЛЁНАЯ`);
  } catch (e) {
    console.log(`${imya}: ОТКАЗ — ${String(e.message).split('\n').slice(0, 3).join(' / ')}`);
  }
};
const integ = konfig.integrations.find((i) => i?.name === 'sayt:sverka-dist');
console.log(`режим ${rezhim}; список на объекте = данным: ${JSON.stringify(integ.obyazatelnaPodpis) === JSON.stringify(OBYAZATELNAYA_PODPIS)}`);
prognat(integ, 'сторож из astro.config.mjs, эталонная сборка');
prognat(sverka({ obyazatelnaPodpis: [...OBYAZATELNAYA_PODPIS, '/net-takoy/'] }), 'сторож со строкой /net-takoy/ в списке');
