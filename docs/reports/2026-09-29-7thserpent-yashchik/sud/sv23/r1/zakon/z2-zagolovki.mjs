// SV23-Z, образец 2: разбор <title> ответа домена сторожем (sostoyanieHosta) — что напечатает строка «ответ N — «…»»
// против того, что владелец увидит во вкладке браузера. Сеть не трогается: функция запроса подставная; для
// кодировки ответа — poluchitSetyu с подменённым globalThis.fetch (ответ собран в памяти, запросов наружу нет).
import { writeFileSync } from 'node:fs';

const SV = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/storozha-vykladki.mjs');
const { sostoyanieHosta, poluchitSetyu } = SV;
const VYVOD = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-sv23-z/z2-vyvod.txt';
const W = 'https://www.7thserpent.com/';

const dlinnyi = 'Поздравляем! ' + 'Это очень длинный заголовок заглушки хостера. '.repeat(4);
const emodzi = 'a'.repeat(99) + '\u{1F600}' + ' хвост';
const SLUCHAI = [
  // [имя, тело, что во вкладке браузера]
  ['заглавные теги', '<HTML><HEAD><TITLE>403 Forbidden</TITLE></HEAD></HTML>', '403 Forbidden'],
  ['атрибуты у <title>', '<title lang="uk" data-x="1">Сайт створено</title>', 'Сайт створено'],
  ['именные сущности', '<title>&laquo;Поздравляем&raquo; &mdash; сайт &amp; почта</title>', '«Поздравляем» — сайт & почта'],
  ['числовые сущности (кириллица)', '<title>&#1055;&#1086;&#1079;&#1076;&#1088;&#1072;&#1074;&#1083;&#1103;&#1077;&#1084;</title>', 'Поздравляем'],
  ['шестнадцатеричные сущности', '<title>&#x41F;&#x440;&#x438;&#x432;&#x435;&#x442;</title>', 'Привет'],
  ['многострочный', '<title>\n   Поздравляем,\n   сайт создан!\n</title>', 'Поздравляем, сайт создан!'],
  ['длинный (обрез без знака обреза)', `<title>${dlinnyi}</title>`, dlinnyi.trim()],
  ['эмодзи на границе 100', `<title>${emodzi}</title>`, emodzi],
  ['кириллица как есть', '<title>Поздравляем, сайт создан!</title>', 'Поздравляем, сайт создан!'],
  ['<title> внутри <svg> раньше заголовка страницы', '<html><head><meta charset="utf-8"></head><body><svg><title>Иконка замка</title></svg><h1>Доступ запрещён</h1></body></html>', ''],
  ['заголовок в комментарии перед настоящим', '<html><head><!-- <title>Старая заглушка</title> --><title>Новая страница</title></head></html>', 'Новая страница'],
  ['заголовок в строке скрипта перед настоящим', '<html><head><script>var t = "<title>из скрипта</title>";</script><title>Настоящий</title></head></html>', 'Настоящий'],
  ['знак < внутри заголовка (RCDATA)', '<title>403 < доступ > нет</title>', '403 < доступ > нет'],
  ['заголовка нет', '<html><body>Forbidden</body></html>', ''],
  ['пустой заголовок', '<title>   </title>', ''],
];

const out = [];
for (const [imya, telo, brauzer] of SLUCHAI) {
  const s = await sostoyanieHosta(async () => ({ status: 200, telo, location: '' }), 'www.7thserpent.com');
  const m = /ответ 200(?: — «([\s\S]*)»)?$/.exec(s.pochemu);
  const napechatano = m?.[1] ?? '';
  const odinakovo = napechatano === brauzer.replace(/\s+/g, ' ').trim();
  out.push(`== ${imya}`);
  out.push(`  строка сторожа: ${s.pochemu}`);
  out.push(`  во вкладке:     ${brauzer || '(у документа заголовка нет — вкладка показывает адрес)'}`);
  out.push(`  совпадает: ${odinakovo ? 'да' : 'НЕТ'}${/[\uD800-\uDFFF]/.test(napechatano) && !/[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(napechatano.slice(-2)) ? ' (одинокая половина суррогатной пары в конце строки)' : ''}`);
}

// Кодировка: страница хостера в windows-1251 (charset в content-type) — Response.text() всегда читает UTF-8.
const CP = new Map();
for (let k = 0x410; k <= 0x44f; k += 1) CP.set(String.fromCharCode(k), 0xc0 + (k - 0x410));
const cp1251 = (t) => Buffer.from([...t].map((c) => (c.charCodeAt(0) < 0x80 ? c.charCodeAt(0) : CP.get(c) ?? 0x3f)));
const tekst1251 = '<html><head><title>Доступ заборонено</title></head><body></body></html>';
const prezhniyFetch = globalThis.fetch;
globalThis.fetch = async () => new Response(cp1251(tekst1251), { status: 403, headers: { 'content-type': 'text/html; charset=windows-1251' } });
try {
  const s = await sostoyanieHosta(poluchitSetyu, 'www.7thserpent.com');
  out.push('== страница 403 в windows-1251 (charset в content-type), через poluchitSetyu с подменённым fetch');
  out.push(`  строка сторожа: ${s.pochemu}`);
  out.push('  во вкладке:     Доступ заборонено');
  out.push(`  совпадает: ${s.pochemu.includes('Доступ заборонено') ? 'да' : 'НЕТ (знаки замены U+FFFD)'}`);
} finally {
  globalThis.fetch = prezhniyFetch;
}

writeFileSync(VYVOD, out.join('\n') + '\n', 'utf8');
console.log(`записано: ${VYVOD} (${out.length} строк)`);
