// Подмена импорта сторожа на испорченную копию (SV23-O2): подлинный файл проб импортирует «../storozha-vykladki.mjs»,
// крючок отдаёт вместо него копию из PORCHA_TSEL (папка скептика). Файлы репозитория не меняются.
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

const ISKHODNYI = 'file:///d:/seo/cloud/site-generator/sites/7thserpent.com/tools/storozha-vykladki.mjs';
const TSEL = pathToFileURL(process.env.PORCHA_TSEL).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    const r = nextResolve(specifier, context);
    return r.url.toLowerCase() === ISKHODNYI ? { ...r, url: TSEL, shortCircuit: true } : r;
  },
});
