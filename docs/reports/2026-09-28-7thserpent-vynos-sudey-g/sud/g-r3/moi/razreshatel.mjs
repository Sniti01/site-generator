// Разрешатель Vite, как его строит @tailwindcss/vite: где падает «Cannot create proxy».
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const require = createRequire(join(SAYT, 'package.json'));
const astroReq = createRequire(require.resolve('astro/package.json'));
const vite = await import(pathToFileURL(astroReq.resolve('vite')).href);
console.log('vite', vite.version);
const shag = async (imya, f) => { try { const r = await f(); console.log(`${imya}: ок`, typeof r === 'string' || r === undefined ? r : typeof r); return r; } catch (e) { console.log(`${imya}: ОШИБКА ${e.message}\n${e.stack.split('\n').slice(1, 6).join('\n')}`); return null; } };
const cfg = await shag('resolveConfig', () => vite.resolveConfig({ root: SAYT, configFile: false, logLevel: 'silent', environments: { ssr: {} } }, 'build'));
if (cfg) {
  console.log('createResolver есть:', typeof cfg.createResolver, '; createIdResolver есть:', typeof vite.createIdResolver);
  const css = await shag('createResolver css', () => cfg.createResolver({ ...cfg.resolve, extensions: ['.css'], mainFields: ['style'], conditions: ['style', 'development|production'], tryIndex: false, preferRelative: true }));
  const imp = resolve(SAYT, 'src/styles/__placeholder__.ts');
  if (css) {
    await shag('css tailwindcss ssr', () => css('tailwindcss', imp, false, true));
    await shag('css tailwindcss client', () => css('tailwindcss', imp, false, false));
    await shag('css @fontsource ssr', () => css('@fontsource/bodoni-moda/latin-600.css', imp, false, true));
  }
  if (vite.createIdResolver) {
    const idr = await shag('createIdResolver', () => vite.createIdResolver(cfg, { ...cfg.resolve, extensions: ['.css'], mainFields: ['style'], conditions: ['style', 'development|production'], tryIndex: false, preferRelative: true }));
    const env = cfg.environments?.ssr;
    console.log('окружения:', Object.keys(cfg.environments ?? {}).join(', '));
    if (idr) await shag('idResolver ssr env', () => idr({ name: 'ssr', config: env ?? cfg, getTopLevelConfig: () => cfg }, 'tailwindcss', imp, false));
  }
}
