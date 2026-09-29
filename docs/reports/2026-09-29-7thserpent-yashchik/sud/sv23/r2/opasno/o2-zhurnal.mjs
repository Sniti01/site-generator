// SV23-O2 · строка хоста в публичный журнал после правки раунда 1 (bezopasno, zagolovokOtveta; SV23-O-3, Z-5).
// Что проверяется: (1) «::» после bezopasno — замена /::/g не повторяется: «:::» → «: ::»; (2) знаки не из Cc/Cf —
// разделители строк U+2028/U+2029, заполнители и пустые знаки — в сыром canonical чужого сайта и в <title>; (3) длина
// canonical не ограничена; (4) двойное раскрытие сущностей в <title> (&#x26;lt; → «<»); (5) негодный Location с «:::».
// Модель раннера — по исходнику actions/runner, как его знает скептик: строки — по \r, \n, \r\n (StreamReader.ReadLine);
// v2 — «::» в начале строки после TrimStart; v1 — «##[» в любом месте, имя до «]» из зарегистрированных. НЕ замер на раннере.
import { SV, W, G, otv, iz, vyvod, ZAGLUSHKA } from './obshchee-o2.mjs';

const ZAREG = ['add-mask', 'add-matcher', 'remove-matcher', 'debug', 'warning', 'error', 'notice', 'group', 'endgroup', 'echo', 'set-output', 'save-state', 'set-env', 'add-path', 'stop-commands'];
function komandaRannera(stroka) {
  for (const s of stroka.split(/\r\n|\r|\n/)) {
    if (s.trimStart().startsWith('::')) return `v2 в строке ${JSON.stringify(s.slice(0, 40))}`;
    const i = s.indexOf('##[');
    if (i >= 0) {
      const k = s.indexOf(']', i);
      if (k >= 0 && ZAREG.includes(s.slice(i + 3, k).split(' ')[0])) return `v1 «${s.slice(i + 3, k)}»`;
    }
  }
  return 'нет';
}
const KATEGORII = [['Zl', /\p{Zl}/u], ['Zp', /\p{Zp}/u], ['Zs не пробел', /(?! )\p{Zs}/u], ['Co', /\p{Co}/u], ['Cn', /\p{Cn}/u], ['Mn', /\p{Mn}/u], ['заполнитель', /[ᅟᅠㅤﾠ⠀]/u]];
const znaki = (s) => {
  const naydeno = new Map();
  for (const c of s) for (const [imya, re] of KATEGORII) if (re.test(c)) naydeno.set(`U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`, imya);
  return naydeno.size ? [...naydeno].map(([k, v]) => `${k} (${v})`).join(', ') : 'нет';
};
const stranica = (golova) => `<!DOCTYPE html><html><head><meta charset="utf-8">${golova}</head><body></body></html>`;
const strokaHosta = async (telo, pervyi = false) => (await SV.domen({ poluchit: iz({ [W]: otv(200, telo), [G]: otv(200, ZAGLUSHKA) }), pervyi })).stroki[0];

const OBRAZCY = [
  ['(1) <title> «a:::b ::::c»', stranica('<title>a:::b ::::c</title>')],
  ['(1) <title> сущностями «&#58;&#58;&#58;set-output»', stranica('<title>x &#58;&#58;&#58;set-output name=a&#58;&#58;b</title>')],
  ['(2) canonical чужого сайта с U+2028 и строкой-подделкой вердикта', stranica(`<title>Домен продаётся</title><link rel="canonical" href="https://chuzhoi.example/ первая выкладка: владелец согласен — выкладка идёт ">`)],
  ['(2) <title> с заполнителями и пустыми знаками (U+3164, U+2800, U+115F, U+FFA0, U+034F, U+E000, U+0378)', stranica('<title>Поздравляем, сайт создан!ㅤㅤ⠀ᅟﾠ͏͸ чужой</title>')],
  ['(4) <title> «&#x26;lt;b&#x26;gt;», «&#x26;#35;&#x26;#35;&#x26;#91;warning]» и «&constructor;»', stranica('<title>&#x26;lt;b&#x26;gt; &#x26;#35;&#x26;#35;&#x26;#91;warning]x &constructor;</title>')],
];

const stroki = ['Строка хоста www в журнал (выкладка не первая — строка печатается и при проходе; первая — так же).', ''];
for (const [imya, telo] of OBRAZCY) {
  const s = await strokaHosta(telo);
  stroki.push(`${imya}:`);
  stroki.push(`  строка (JSON): ${JSON.stringify(s)}`);
  stroki.push(`  «::» в строке: ${s.includes('::') ? 'да' : 'нет'}; «##[» в строке: ${s.includes('##[') ? 'да' : 'нет'}; знаки не из Cc/Cf: ${znaki(s)}; команда раннера (модель): ${komandaRannera(s)}`, '');
}

// (3) длина canonical не ограничена: canonical чужого сайта в 200 000 знаков.
const dlinnyy = await strokaHosta(stranica(`<link rel="canonical" href="https://chuzhoi.example/${'a'.repeat(200000)}">`));
stroki.push(`(3) canonical чужого сайта длиной 200 000 знаков: длина строки хоста — ${dlinnyy.length} знаков (заголовок обрезается до 100, canonical — нет)`, '');

// (5) негодный Location с «:::» — печатается сырым (до 100 знаков), «::» переживает bezopasno.
const loc = (await SV.domen({ poluchit: iz({ [W]: otv(301, '', 'http://:::set-output name=a::b'), [G]: otv(200, ZAGLUSHKA) }), pervyi: false })).stroki[0];
stroki.push(`(5) 301 на негодный Location «http://:::set-output name=a::b»:`);
stroki.push(`  строка (JSON): ${JSON.stringify(loc)}`);
stroki.push(`  «::» в строке: ${loc.includes('::') ? 'да' : 'нет'}; команда раннера (модель): ${komandaRannera(loc)}`, '');

// Прямо: bezopasno не идемпотентна по «::».
const bez = (x) => String(x).replace(/[\p{Cc}\p{Cf}]/gu, ' ').replace(/##\[/g, '# #[').replace(/::/g, ': :');
stroki.push(`bezopasno (копия формулы сторожа): «:::» → ${JSON.stringify(bez(':::'))}; «::::» → ${JSON.stringify(bez('::::'))}; повтор над «: ::» → ${JSON.stringify(bez(bez(':::')))}`);
stroki.push('');
stroki.push('Вывод: команды раннера нет ни в одном образце (строка хоста начинается с имени хоста — v2 невозможна; «##[» погашено');
stroki.push('всюду, в том числе после двойного раскрытия). Но заявленное «:: погашены» неверно («:::» → «: ::»), разделители строк');
stroki.push('U+2028/U+2029 и пустые знаки не из Cc/Cf проходят (canonical печатается сырым и без предела длины), а <title> раскрывает');
stroki.push('сущности дважды. Как веб-журнал GitHub рисует U+2028 — не измерено (раннер строку по нему не режет).');
vyvod('o2-zhurnal-vyvod.txt', stroki);
