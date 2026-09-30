// Что держит (скептик SV25-O, «опасный проход»): порчи содержимого и имени файла Google, папки и ссылки, файл в сборке
// и глубже корня, строки журнала, согласованность workflow и сторожа, живой сценарий ближайшей выкладки.
// Сторож — копия f57bbb9; lftp — модель (вариант А — как я знаю разборщик и mirror lftp; пределы — в SV25-O-1).
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { SV, VERKH, NASH, KOREN_NASH, FIND_NASH, GOOGLE, STROKA, distNash, rabochaya, komanda, vyvod, shag, WF, isklyucheniyaMirror, mirrorKoren, globV } from './obshchee-o.mjs';

const { papka, pereschet, glubina, indeks, pervayaVykladka, podtverzhdenieGoogle, FAJL_GOOGLE, razobratSpisok } = SV;
const stroki = [];
let narusheniy = 0;
const zhdu = (uslovie, tekst) => {
  if (!uslovie) narusheniy += 1;
  stroki.push(`${uslovie ? 'держит' : 'НЕ ДЕРЖИТ'} — ${tekst}`);
};
const z = (...k) => String.fromCharCode(...k);
const B = (s) => Buffer.from(s, 'utf8');
const dist = distNash('d-dist');
const w = rabochaya('derzhit');
const ZHURNAL_ZLO = new RegExp(`[${z(0)}-${z(8)}${z(0xb)}-${z(0x1f)}${z(0x7f)}-${z(0x9f)}${z(0x2028, 0x2029)}${z(0x202a)}-${z(0x202e)}${z(0x2066)}-${z(0x2069)}]|##\\[|^::`, 'm');

/* A. Содержимое скачанной копии — командой, как в workflow (чтение файла utf8). */
stroki.push('A. содержимое копии, команда papka (корень — наша выкладка и файл Google):');
const S = STROKA(GOOGLE);
const SODERZHIMOE = [
  ['ровно строка', B(S), 0],
  ['строка + LF', B(`${S}\n`), 0],
  ['строка + CRLF', B(`${S}\r\n`), 0],
  ['BOM UTF-8 + строка', Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), B(S)]), 1],
  ['UTF-16LE с BOM', Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(S, 'utf16le')]), 1],
  ['строка + NUL', Buffer.concat([B(S), Buffer.from([0])]), 1],
  ['NUL + строка', Buffer.concat([Buffer.from([0]), B(S)]), 1],
  ['NBSP вместо пробела', B(S.replace(': ', `:${z(0xa0)}`)), 1],
  ['точка имени — overlong C0 AE', Buffer.concat([B(S.slice(0, -5)), Buffer.from([0xc0, 0xae]), B('html')]), 1],
  ['строка + одиночный 0xFF', Buffer.concat([B(S), Buffer.from([0xff])]), 1],
  ['строка + CR', B(`${S}\r`), 1],
  ['строка + LF CR', B(`${S}\n\r`), 1],
  ['строка + CRLF CRLF', B(`${S}\r\n\r\n`), 1],
  ['строка + U+2028', B(`${S}${z(0x2028)}`), 1],
  ['ZWSP внутри ключа', B(S.replace('site', `si${z(0x200b)}te`)), 1],
  ['кириллическая «е» в ключе', B(S.replace('site', `sit${z(0x435)}`)), 1],
  ['строка + комментарий HTML', B(`${S}<!-- ::error::ZLOY-MARKER -->`), 1],
  ['скрипт на второй строке', B(`${S}\n<script>ZLOY-MARKER</script>`), 1],
  ['таб вместо пробела', B(S.replace(': ', ':\t')), 1],
  ['имя внутри заглавными', B(`google-site-verification: ${GOOGLE.toUpperCase()}`), 1],
  ['20 МБ «A» (большой файл)', Buffer.alloc(20 * 1024 * 1024, 0x41), 1],
];
const KOREN_G = KOREN_NASH() + `${GOOGLE}\n`;
SODERZHIMOE.forEach(([chto, baity, kod], i) => {
  const d = join(w, `a${i}`);
  mkdirSync(join(d, 'remote-top'), { recursive: true });
  writeFileSync(join(d, 'remote-root.txt'), KOREN_G);
  writeFileSync(join(d, 'remote-top', 'index.html'), NASH);
  writeFileSync(join(d, 'remote-top', GOOGLE), baity);
  const t0 = Date.now();
  const k = komanda('papka', join(d, 'remote-root.txt'), join(d, 'remote-top', 'index.html'), dist, join(d, 'remote-top', 'sitemap-0.xml'), join(d, 'remote-top'));
  const chisto = !k.vyvod.includes('ZLOY-MARKER') && !ZHURNAL_ZLO.test(k.vyvod);
  zhdu(k.kod === kod && chisto, `${chto}: код ${k.kod} (ждём ${kod}), ${Date.now() - t0} мс; содержимое в журнал не попало: ${chisto}`);
});

/* B. Перебор однобайтовых и многобайтовых порч: проход только у байтов, равных одной из трёх законных форм. */
const ZAKON = [B(S), B(`${S}\n`), B(`${S}\r\n`)];
const zakonnyi = (b) => ZAKON.some((x) => x.equals(b));
let proverok = 0;
let lozhnykh = 0;
const proba = (b) => {
  proverok += 1;
  if (podtverzhdenieGoogle(GOOGLE, b.toString('utf8')) && !zakonnyi(b)) lozhnykh += 1;
};
const VSTAVKI = [[0xc0, 0x80], [0xc1, 0xbf], [0xe0, 0x80, 0x80], [0xed, 0xa0, 0x80], [0xf4, 0x90, 0x80, 0x80], [0xef, 0xbb, 0xbf], [0xc2, 0xa0], [0xe2, 0x80, 0x8b], [0xf0, 0x9f], [0xe2, 0x80]];
for (const osnova of ZAKON) {
  for (let pos = 0; pos <= osnova.length; pos += 1) {
    for (let bajt = 0; bajt < 256; bajt += 1) proba(Buffer.concat([osnova.subarray(0, pos), Buffer.from([bajt]), osnova.subarray(pos)]));
    for (const v of VSTAVKI) proba(Buffer.concat([osnova.subarray(0, pos), Buffer.from(v), osnova.subarray(pos)]));
    if (pos < osnova.length) {
      proba(Buffer.concat([osnova.subarray(0, pos), osnova.subarray(pos + 1)]));
      for (let bajt = 0; bajt < 256; bajt += 1) {
        const c = Buffer.from(osnova);
        c[pos] = bajt;
        proba(c);
      }
    }
  }
}
zhdu(lozhnykh === 0, `B. порчи байтов законного содержимого (вставка, удаление, замена байта; вставка многобайтовых и неверных последовательностей UTF-8): ${proverok} проб, проход с байтами не законной формы — ${lozhnykh} (декодер UTF-8 не даёт ASCII из неверных байтов: «�» остаётся в строке)`);

/* C. Имена: не той формы — не файл Google; в каждой ветви сторожа — стоп. */
const IMENA = [
  'Google0123456789abcdef.html', 'google0123456789abcdef.HTML', 'google0123456789abcdef.htm', 'google0123456789abcdef.html.', 'google0123456789abcdef.html.bak',
  'google.html', 'google-0123456789.html', 'google_0123456789.html', `g${z(0x43e, 0x43e)}gle0123456789abcdef.html`, `google${z(0xff10)}123.html`, `google0123456789abcdef.html${z(0x200b)}`,
  '.google0123456789abcdef.html', 'google0123456789abcdef.html;rm', 'google0123456789abcdef.html.php', `${GOOGLE}/`, `${GOOGLE}@`,
];
let imenStop = 0;
for (const s of IMENA) {
  const imya = s.replace(/[/@]$/, '');
  const sk = { [imya]: STROKA(imya) };
  const r1 = papka(KOREN_NASH() + `${s}\n`, NASH, VERKH, null, sk);
  const r2 = papka(`./\n../\n.well-known/\n${s}\n`, null, VERKH, null, sk);
  const r3 = papka(`./\n../\n${s}\n`, null, VERKH, null, sk);
  if (!r1.ok && !r2.ok && !r3.ok) imenStop += 1;
  else stroki.push(`    имя ${JSON.stringify(s)}: рядом с выкладкой ${r1.ok}, свежий каталог ${r2.ok}, одно в корне ${r3.ok}`);
}
zhdu(imenStop === IMENA.length, `C. имена не той формы (регистр, расширение, точка/суффикс, кириллица, полноширинная цифра, ZWSP, дефис, «;», папка «/», ссылка «@»): стоп во всех трёх ветвях — ${imenStop} из ${IMENA.length}`);
const obrazetsBezSostoyaniya = !FAJL_GOOGLE.global && !FAJL_GOOGLE.sticky && [1, 2, 3, 4].every(() => FAJL_GOOGLE.test(GOOGLE));
zhdu(obrazetsBezSostoyaniya, `C. FAJL_GOOGLE без флагов g/y (${FAJL_GOOGLE.flags || 'нет флагов'}): повторный test не меняет исход`);
zhdu(!IMENA.concat(['../x.html', 'google../../x.html', 'google%2e%2e.html']).some((s) => FAJL_GOOGLE.test(s) && /[/\\]|\.\./.test(s)), 'C. обход пути невозможен: образец — только буквы и цифры между «google» и «.html», путь к копии — join(папка скачанного, имя)');

/* D. Файл Google в сборке. */
const rD = papka('./\n../\n', null, [...VERKH, GOOGLE], null, {});
const dD = distNash('d-dist-google');
writeFileSync(join(dD, GOOGLE), STROKA(GOOGLE));
const dk = join(w, 'd');
mkdirSync(dk, { recursive: true });
writeFileSync(join(dk, 'remote-root.txt'), KOREN_NASH());
writeFileSync(join(dk, 'index.html'), NASH);
const kD = komanda('papka', join(dk, 'remote-root.txt'), join(dk, 'index.html'), dD, join(dk, 'net.xml'), dk);
zhdu(!rD.ok && kD.kod === 1 && kD.vyvod.includes('в сборке файл подтверждения Google'), `D. файл Google в верхе сборки: функция — ${rD.ok ? 'проход' : 'стоп'}, команда (dist с файлом) — код ${kD.kod}`);
const isk = isklyucheniyaMirror(shag('Выкладка по FTPS').run);
const rx = new RegExp(isk.find((i) => i.tekst.startsWith('^google')).tekst);
zhdu(!rx.test(`privacy/${GOOGLE}`) && !rx.test(`${GOOGLE}/`) && rx.test(GOOGLE), 'D. -x из workflow (вариант А): корень — исключён; «privacy/…» и папка «…/» — нет (путь от корня mirror, папке дописана косая): глубже корня файл выкладывается и считается, как у сторожа');

/* E. Глубже корня: глубина и пересчёт. */
const fajly = Object.keys(SV.spisokSborki(dist).fajly);
const gl = glubina(FIND_NASH() + `./privacy/${GOOGLE}\n`, NASH, fajly, null);
const glAstro = glubina(FIND_NASH() + `./_astro/${GOOGLE}\n`, NASH, fajly, null);
const prGl = pereschet(FIND_NASH() + `./privacy/${GOOGLE}\n`, dist);
zhdu(!gl.ok && !prGl.ok, `E. файл Google в privacy/: глубина — ${gl.ok ? 'проход' : 'стоп'}, пересчёт — ${prGl.ok ? 'проход' : 'стоп'}`);
stroki.push(`    справка: файл Google прямо в _astro/ глубина пропускает (${glAstro.ok ? 'проход' : 'стоп'}) — прежнее правило «прямые файлы _astro/ — ассеты прежних сборок»; mirror его стирает, П113 тут ни при чём`);

/* F. Строки журнала: новые строки печатают только имена образца (ASCII), содержимое — никогда. */
const zlyeImena = [`google${z(0x202e)}lmth.html`, 'google::error::x.html', `google##[group]x.html`];
const vyvodyF = zlyeImena.map((n) => papka(KOREN_NASH() + `${n}\n`, NASH, VERKH, null, { [n]: STROKA(n) }).stroki.join('\n'));
const tolkoObrazets = [papka(KOREN_NASH() + `${GOOGLE}\n`, NASH, VERKH, null, { [GOOGLE]: 'x' }).stroki.join('\n'), papka(KOREN_NASH() + `${GOOGLE}\n`, NASH, VERKH, null, { [GOOGLE]: S }).stroki.join('\n')];
zhdu(vyvodyF.every((t) => !t.includes('файл подтверждения Google')) && tolkoObrazets.every((t) => !ZHURNAL_ZLO.test(t)), 'F. имена с управляющими знаками и командами раннера под видом файла Google образцом не берутся (строка отказа о них — прежняя, SV3); строки П113 содержат только имена образца');

/* G. Workflow: скачивание, аргумент сторожа, исключение mirror, кавычки bash. */
const runS = shag('Сторож папки робота').run;
const mS = /mirror (--no-recursion [^;]*) \. (\S+); bye/.exec(runS);
const celevaya = mS?.[2];
const pyatyi = /storozha-vykladki\.mjs papka remote-root\.txt \S+ \S+ \S+ (\S+)\s*$/m.exec(runS)?.[1];
zhdu(Boolean(mS) && /--include-glob=google\*\.html/.test(mS[1]) && celevaya === pyatyi, `G. скачивание — mirror ${mS?.[1]} в «${celevaya}»; пятый аргумент сторожа — «${pyatyi}»: одна папка, --no-recursion (вложенные папки не обходятся)`);
const sluchainoe = (n) => Array.from({ length: n }, () => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 62)]).join('');
const obraztsy = Array.from({ length: 2000 }, (_, i) => `google${sluchainoe(1 + (i % 40))}.html`);
const glob = globV('google*.html');
zhdu(obraztsy.every((n) => FAJL_GOOGLE.test(n) && glob.test(n) && rx.test(n)), 'G. 2000 случайных имён образца: каждое берёт и glob скачивания google*.html, и -x выкладки (вариант А) — что сторож сверяет, то скачано и исключено');
zhdu(isk.some((i) => i.vid === 'x' && i.tekst === FAJL_GOOGLE.source), `G. -x выкладки дословно равен образцу сторожа: ${FAJL_GOOGLE.source}`);
// bash: одинарные кавычки внутри двойных — буквальные; «$'» в двойных кавычках — буквально; раскрываются только $ИМЯ.
const bashDvoynye = (s, env) => {
  let out = '';
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (c === '\\' && i + 1 < s.length && '$`"\\\n'.includes(s[i + 1])) {
      if (s[i + 1] !== '\n') out += s[i + 1];
      i += 1;
    } else if (c === '$') {
      const m = /^\$(?:\{([A-Za-z_]\w*)\}|([A-Za-z_]\w*))/.exec(s.slice(i));
      if (m) {
        out += env[m[1] ?? m[2]] ?? '';
        i += m[0].length - 1;
      } else out += c;
    } else out += c;
  }
  return out;
};
const argE = (run) => {
  const i = run.indexOf('-e "') + 4;
  let j = i;
  while (j < run.length && !(run[j] === '"' && run[j - 1] !== '\\')) j += 1;
  return run.slice(i, j);
};
const env = { LFTP_SET: WF.jobs.deploy.env.LFTP_SET, SERPENT_FTP_USER: 'u', SERPENT_FTP_PORT: '21', SERPENT_FTP_HOST: 'h', SITE: 'sites/7thserpent.com' };
const lftpVykladka = bashDvoynye(argE(shag('Выкладка по FTPS').run), env);
const lftpSkachat = bashDvoynye(argE(runS.split('\n').find((s) => s.includes('remote-top; bye'))), env);
zhdu(lftpVykladka.includes(`-x '${FAJL_GOOGLE.source}' -x '^index\\.html$' sites/7thserpent.com/dist/ .`), `G. после bash строка lftp выкладки: …${lftpVykladka.slice(lftpVykladka.indexOf('mirror'), lftpVykladka.indexOf('; put'))}`);
zhdu(lftpSkachat.includes('--include-glob=google*.html . remote-top'), `G. после bash строка lftp скачивания: …${lftpSkachat.slice(lftpSkachat.indexOf('mirror'))}`);

/* H. Живой сценарий ближайшей выкладки (вариант А): наша прежняя выкладка + файл владельца законной формы. */
for (const [chto, telo] of [['без перевода строки', S], ['LF', `${S}\n`], ['CRLF', `${S}\r\n`]]) {
  const p = papka(KOREN_NASH() + `${GOOGLE}\n`, NASH, VERKH, null, { [GOOGLE]: telo });
  const ix = indeks(NASH);
  const findDo = FIND_NASH() + `./${GOOGLE}\n`;
  const gl2 = glubina(findDo, NASH, fajly, null);
  const perv = pervayaVykladka('off', NASH, findDo);
  const m = mirrorKoren(razobratSpisok(KOREN_NASH() + `${GOOGLE}\n`), VERKH, isk, 'А');
  const pr = pereschet(findDo, dist);
  zhdu(p.ok && ix.ok && gl2.ok && !perv.pervaya && m.ostavit.includes(GOOGLE) && !m.udalit.includes(GOOGLE) && pr.ok, `H. файл владельца (${chto}): папка ${p.ok}, index ${ix.ok}, глубина ${gl2.ok}, первая ${perv.pervaya}, mirror не трогает ${m.ostavit.includes(GOOGLE)}, пересчёт ${pr.ok}`);
}

/* I. Команда: пятый аргумент — только файлы образца из списка; папка вместо файла, нет папки, нет аргумента — стоп. */
const ik = join(w, 'i');
mkdirSync(join(ik, 'remote-top', GOOGLE), { recursive: true });
writeFileSync(join(ik, 'remote-root.txt'), KOREN_G);
writeFileSync(join(ik, 'remote-top', 'index.html'), NASH);
const kPapkaVmesto = komanda('papka', join(ik, 'remote-root.txt'), join(ik, 'remote-top', 'index.html'), dist, join(ik, 'net.xml'), join(ik, 'remote-top'));
const kNetPapki = komanda('papka', join(ik, 'remote-root.txt'), join(ik, 'remote-top', 'index.html'), dist, join(ik, 'net.xml'), join(ik, 'net-papki'));
const kBez = komanda('papka', join(ik, 'remote-root.txt'), join(ik, 'remote-top', 'index.html'), dist, join(ik, 'net.xml'));
const kShest = komanda('papka', join(ik, 'remote-root.txt'), join(ik, 'remote-top', 'index.html'), dist, join(ik, 'net.xml'), join(ik, 'remote-top'), 'lishniy');
zhdu(kPapkaVmesto.kod === 1 && kNetPapki.kod === 1 && kBez.kod === 1 && kShest.kod === 2, `I. копия — папка: код ${kPapkaVmesto.kod}; папки скачанного нет: код ${kNetPapki.kod}; без пятого аргумента: код ${kBez.kod}; шесть аргументов: код ${kShest.kod}`);

/* J. Корень только с файлом Google (без нашей сборки) — как пустой корень: первая выкладка, дальше — сторож домена. */
const tolkoG = papka(`./\n../\n${GOOGLE}\n`, null, VERKH, null, { [GOOGLE]: S });
const pustoi = papka('./\n../\n', null, VERKH, null, {});
const perv = pervayaVykladka('off', null, `./\n./${GOOGLE}\n`);
zhdu(tolkoG.ok && pustoi.ok && perv.pervaya, `J. корень только с файлом Google: ${tolkoG.stroki[0]}; пустой корень: ${pustoi.stroki[0]}; признак первой — ${perv.pervaya} (${perv.pochemu}): риск «не тот каталог» тот же, что у пустого корня (прежний), второй барьер — сторож домена первой выкладки`);

stroki.push(`ИТОГ: нарушений ${narusheniy}`);
vyvod('derzhit.txt', stroki);
