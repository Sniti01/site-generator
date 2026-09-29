// SV23-Z, образец 1: что отвечает домен после удаления заглушки (и иные законные формы) × вход согласия —
// вердикт сторожа домена при первой выкладке и правда итоговой строки «домен покажет её сразу».
// Сеть не трогается: функция запроса — подставная (как в пробах исполнителя).
import { writeFileSync } from 'node:fs';

const SV = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/storozha-vykladki.mjs');
const { domen, sostoyanieHosta, HOSTY } = SV;
const VYVOD = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-sv23-z/z1-vyvod.txt';

const W = 'https://www.7thserpent.com/';
const G = 'https://7thserpent.com/';
const otv = (status, telo = '', location = '') => ({ status, telo, location });
const osh = (kod) => ({ oshibka: kod });
const iz = (karta) => async (url) => {
  if (!(url in karta)) throw new Error(`запрос вне образца: ${url}`);
  return karta[url];
};
const A403 = '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">\n<html><head>\n<title>403 Forbidden</title>\n</head><body>\n<h1>Forbidden</h1>\n</body></html>\n';
const A404 = '<html><head><title>404 Not Found</title></head><body><h1>Not Found</h1></body></html>';
const NC = (h) => `<html><body><h1>Website ${h} not configured</h1></body></html>`;
const LISTING = '<html><head><title>Index of /</title></head><body><h1>Index of /</h1></body></html>';
const ZAGL = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Поздравляем, сайт создан!</title></head><body></body></html>';

const SLUCHAI = [
  ['403 на обоих именах (пустой www, Apache)', { [W]: otv(403, A403), [G]: otv(403, A403) }],
  ['404 сервера на обоих', { [W]: otv(404, A404), [G]: otv(404, A404) }],
  ['404 «Website … not configured» на обоих', { [W]: otv(404, NC('www.7thserpent.com')), [G]: otv(404, NC('7thserpent.com')) }],
  ['пустая страница 200 на обоих', { [W]: otv(200, ''), [G]: otv(200, '') }],
  ['листинг каталога 200 «Index of /»', { [W]: otv(200, LISTING), [G]: otv(200, LISTING) }],
  ['голое имя → 301 → www → 403 (канонизация хостера)', { [W]: otv(403, A403), [G]: otv(301, '', W) }],
  ['заглушка из кэша nginx 200', { [W]: otv(200, ZAGL), [G]: otv(200, ZAGL) }],
  ['503 на обоих (хостер пересоздаёт сайт)', { [W]: otv(503, '<title>503 Service Unavailable</title>'), [G]: otv(503, '<title>503 Service Unavailable</title>') }],
  ['TLS до выпуска: чужой сертификат хостера (ERR_TLS_CERT_ALTNAME_INVALID) на обоих', { [W]: osh('ERR_TLS_CERT_ALTNAME_INVALID'), [G]: osh('ERR_TLS_CERT_ALTNAME_INVALID') }],
  ['TLS до выпуска: самоподписанный (DEPTH_ZERO_SELF_SIGNED_CERT) на обоих', { [W]: osh('DEPTH_ZERO_SELF_SIGNED_CERT'), [G]: osh('DEPTH_ZERO_SELF_SIGNED_CERT') }],
  ['TLS: сертификат истёк (CERT_HAS_EXPIRED) на обоих', { [W]: osh('CERT_HAS_EXPIRED'), [G]: osh('CERT_HAS_EXPIRED') }],
  ['таймаут на обоих', { [W]: osh('TimeoutError'), [G]: osh('TimeoutError') }],
  ['www не разрешается, голое 403', { [W]: osh('ENOTFOUND'), [G]: otv(403, A403) }],
  ['www «not configured», голое 403 (www не привязан к сайту)', { [W]: otv(404, NC('www.7thserpent.com')), [G]: otv(403, A403) }],
  ['www — ошибка сертификата, голое не разрешается', { [W]: osh('ERR_TLS_CERT_ALTNAME_INVALID'), [G]: osh('ENOTFOUND') }],
  ['www → 302 на чужую парковку', { [W]: otv(302, '', 'https://parking.example/'), 'https://parking.example/': otv(200, '<title>Domain parking</title>'), [G]: otv(302, '', 'https://parking.example/') }],
  ['www → 301 на имя, которого нет', { [W]: otv(301, '', 'https://nety.example/'), 'https://nety.example/': osh('ENOTFOUND'), [G]: otv(301, '', W) }],
  ['петля редиректов на обоих', { [W]: otv(301, '', W), [G]: otv(301, '', G) }],
  ['домен отвечает первым сайтом (имя привязано не к тому каталогу в панели)', { [W]: otv(200, '<html><head><title>AC4 Black Flag</title><link rel="canonical" href="https://www.ac4bf-thewatch.com/"></head></html>'), [G]: otv(301, '', W) }],
];

const TLS = /\b(ERR_TLS_|CERT_|DEPTH_ZERO_|SELF_SIGNED_|UNABLE_TO_)/;
const out = [];
for (const [imya, karta] of SLUCHAI) {
  out.push(`== ${imya}`);
  const sost = [];
  for (const h of HOSTY) sost.push({ h, ...(await sostoyanieHosta(iz(karta), h)) });
  for (const soglasen of [true, false]) {
    let r;
    try {
      r = await domen({ poluchit: iz(karta), pervyi: true, soglasen });
    } catch (e) {
      out.push(`  согласие ${soglasen ? 'on' : 'off'}: ИСКЛЮЧЕНИЕ ${e.message}`);
      continue;
    }
    out.push(`  согласие ${soglasen ? 'on' : 'off'}: ${r.ok ? 'проход' : 'СТОП'}`);
    for (const s of r.stroki) out.push(`    | ${s}`);
    const itog = r.stroki.at(-1);
    if (itog.includes('покажет её сразу')) {
      const pochemu = [];
      for (const s of sost) {
        const konec = s.put.at(-1).split(' — ')[0];
        const hostKontsa = (() => { try { return new URL(konec).host; } catch { return '?'; } })();
        const kanonKontsa = SV.canonicalOf(karta[konec]?.telo ?? '');
        if (s.sostoyanie !== 'отвечает') pochemu.push(`${s.h}: ${s.sostoyanie}${TLS.test(s.pochemu) ? ' (сертификат, а в строке — «ошибка сети»)' : ''}`);
        else if (!HOSTY.includes(hostKontsa)) pochemu.push(`${s.h}: конечный ответ не с нашего имени (${hostKontsa})`);
        else if (kanonKontsa.length && !kanonKontsa.every((k) => k.startsWith(SV.KANON))) pochemu.push(`${s.h}: отвечает чужой сайт (canonical ${kanonKontsa.join(', ')}) — имя смотрит не в наш каталог`);
        else if (/больше 5 редиректов|имя, которого нет/.test(s.pochemu)) pochemu.push(`${s.h}: ${s.pochemu}`);
      }
      out.push(`    → «покажет её сразу»: ${pochemu.length ? `НЕ ОБОСНОВАНО — ${pochemu.join('; ')}` : 'обосновано (оба имени отвечают с нашего хоста)'}`);
    }
    if (!r.ok) {
      const tlsVStroke = sost.some((s) => TLS.test(s.pochemu));
      if (tlsVStroke) out.push(`    → подсказка стопа при ошибке сертификата: ${/записи DNS/.test(itog) ? 'посылает к записям DNS, о сертификате (SSL) — ни слова' : 'без DNS'}`);
    }
  }
}
writeFileSync(VYVOD, out.join('\n') + '\n', 'utf8');
console.log(`записано: ${VYVOD} (${out.length} строк)`);
