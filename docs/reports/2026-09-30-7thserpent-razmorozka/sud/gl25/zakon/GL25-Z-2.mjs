// GL25-Z-2 — откат (Run workflow из метки со входом SERPENT_ROLLBACK = on), и git ls-remote упал (сеть, 429, 5xx):
// строка СТОП «голову main не узнать» велит «Новый запуск кнопкой Run workflow» — без «из той же ветки или метки и со
// входом SERPENT_ROLLBACK = on». Буквальное исполнение — форма Run workflow по умолчанию (main, вход off) — проходит
// сторожа головы и выкладывает голову main: откат тихо не случился (строка прохода — обычная, без «ОТКАТ»).
// У сторожа домена того же файла для этого случая есть готовая форма (NOVYI_ZAPUSK: «с теми же входами, не Re-run»).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-gl25/zakon';
const FAJL = `${PAPKA}/kopiya/sites/7thserpent.com/tools/storozha-vykladki.mjs`;
const SV = await import(pathToFileURL(FAJL).href);

const out = [];
const p = (s = '') => out.push(s);
const GOLOVA = 'f22bb920398794800ae78474dbe5d5a839ce6c76';
const METKA = '9ebb57800000000000000000000000000000abcd'; // коммит метки отката (не голова)
const U = "https://github.com/Sniti01/site-generator/";
// Строки stderr git при сбое (формы сообщений git/curl; здесь не измерены — сеть только к одному адресу).
const OSHIBKI = [
  ['имя хоста не разрешилось', `fatal: unable to access '${U}': Could not resolve host: github.com`],
  ['ограничение частоты', `fatal: unable to access '${U}': The requested URL returned error: 429`],
  ['сбой GitHub', `fatal: unable to access '${U}': The requested URL returned error: 503`],
  ['таймаут соединения', `fatal: unable to access '${U}': Failed to connect to github.com port 443 after 134008 ms: Couldn't connect to server`],
];

for (const [imya, stroka] of OSHIBKI) {
  const r = SV.golova({ kommit: METKA, lsRemote: '', oshibki: `${stroka}\ngit ls-remote закончился ненулевым кодом\n`, otkat: true });
  const t = r.stroki.join(' ');
  p(`[откат, ${imya}] ok = ${r.ok}`);
  p(`  ${t}`);
  p(`  велит новый Run workflow: ${/Новый запуск кнопкой Run workflow/.test(t) ? 'да' : 'нет'}; называет ту же ветку или метку: ${/той же ветк|той же метк|ветки или метки/.test(t) ? 'да' : 'НЕТ'}; называет вход SERPENT_ROLLBACK: ${/SERPENT_ROLLBACK/.test(t) ? 'да' : 'НЕТ'}; «репозиторий открыт для чтения» при сбое сети: ${/открыт для чтения/.test(t) ? 'да' : 'нет'}`);
}

// Буквальное исполнение: форма Run workflow по умолчанию — ветка main, SERPENT_ROLLBACK off (выражение workflow даёт 'off').
const bukv = SV.golova({ kommit: GOLOVA, lsRemote: `${GOLOVA}\trefs/heads/main\n`, oshibki: '', otkat: false });
p();
p(`[буквально: «Новый запуск кнопкой Run workflow» — форма по умолчанию (main, вход off)] ok = ${bukv.ok}`);
p(`  ${bukv.stroki.join(' ')}`);
p(`  выкладывается голова main ${GOLOVA.slice(0, 7)}, а не коммит отката ${METKA.slice(0, 7)}; строки «ОТКАТ» нет: ${!/ОТКАТ/.test(bukv.stroki.join(' ')) ? 'да' : 'нет'}`);

// Та же форма у сторожа домена (тот же файл) — для сравнения.
const m = /const NOVYI_ZAPUSK = '([^']+)'/.exec(readFileSync(FAJL, 'utf8'));
p();
p(`у сторожа домена (тот же файл): NOVYI_ZAPUSK = «${m ? m[1] : '(не найдено)'}»`);
// И стоп «не голова» со входом off: там вход назван, а в стопе сбоя — нет.
const neGolova = SV.golova({ kommit: METKA, lsRemote: `${GOLOVA}\trefs/heads/main\n`, otkat: false });
p(`для сравнения, СТОП «не голова main» называет вход: ${/SERPENT_ROLLBACK = on/.test(neGolova.stroki.join(' ')) ? 'да' : 'нет'}`);

p();
p('ИТОГ: сторож знает, что это откат (otkat = true), но строка СТОП сбоя git этого не говорит; прямое исполнение совета');
p('выкладывает голову main вместо отката. Опасности для сервера нет (голова и так на сайте, если откат ещё не шёл),');
p('но откат молча не сделан — владелец увидит зелёный прогон.');

const vyvod = `${out.join('\n')}\n`;
writeFileSync(join(PAPKA, 'GL25-Z-2-vyvod.txt'), vyvod);
console.log(vyvod);
