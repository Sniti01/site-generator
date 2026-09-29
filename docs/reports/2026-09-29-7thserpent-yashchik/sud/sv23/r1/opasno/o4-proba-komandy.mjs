// SV23-O-4: проба «SV23 команда domen» (storozha-vykladki.test.mjs, строки 568–587) — те же условия, четыре прогона.
//  А — заглушка пробы (исходник взят из файла пробы) и замок сети первым: журнал замка пуст — подмена держит; но
//      сообщение заглушки «сеть в пробе запрещена» в выводе не бывает никогда: сторож печатает e.name («Error»),
//      первая половина /сеть в пробе запрещена|Error/ мертва, держит вторая — любое имя ошибки с «Error»;
//  Б — без заглушки, только замок (ошибка без кода, как у fetch, упавшего без кода): условия пробы выполнены, хотя
//      команда шла к живому домену — замок записал сокеты www.7thserpent.com:443 и 7thserpent.com:443;
//  Г — заглушка, которая бросает то же, что настоящий fetch по таймауту AbortSignal (DOMException TimeoutError):
//      условия пробы выполнены — проба не отличает свою заглушку от настоящей сети;
//  В — порча сторожа (копия вне репозитория): запрос в сеть ДО проверки входа, затем код 2 — условия пробы выполнены,
//      перехват fetch записал по два запроса на каждое неверное значение: «код 2 до сети» пробой не проверяется.
// Ни одного запроса наружу: замок проверен на петле (proverka-zamka-vyvod.txt) и стоит первым в каждом прогоне.
import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { PAPKA, STOROZH, PROBY, adresFajla, zapuskKomandy, vyvod } from './obshchee-o.mjs';

const ZAMOK = adresFajla(join(PAPKA, 'zamok-seti.mjs'));
const PEREKHVAT = adresFajla(join(PAPKA, 'perekhvat.mjs'));
const zhurnalZamka = join(PAPKA, 'o4-zhurnal-zamka.txt');
const zhurnalPerekhvata = join(PAPKA, 'o4-zhurnal-perekhvata.txt');
const dataUrl = (kod) => `data:text/javascript;base64,${Buffer.from(kod).toString('base64')}`;

// Заглушка пробы — её исходник из файла пробы, как есть.
const tekstProby = readFileSync(PROBY, 'utf8');
const m = /const BEZ_SETI = `data:text\/javascript;base64,\$\{Buffer\.from\("([^"]*)"\)/.exec(tekstProby);
if (!m) throw new Error('в файле пробы не найдена заглушка BEZ_SETI');
const ZAGLUSHKA_PROBY = dataUrl(m[1]);
const ZAGLUSHKA_TAJMAUT = dataUrl("globalThis.fetch = async () => { throw new DOMException('The operation was aborted due to timeout', 'TimeoutError'); };");

const chistit = (f) => {
  if (existsSync(f)) rmSync(f);
};
const prochest = (f) => (existsSync(f) ? readFileSync(f, 'utf8').trim().split('\n').filter(Boolean) : []);

/** Условия пробы дословно (строки 573–586); zapusk(vkhod) → { status, stdout, stderr }. */
function usloviyaProby(zapusk) {
  const est = [];
  const da = zapusk('on');
  est.push(['on: код 0', da.status === 0], ['on: в выводе SERPENT_DOMAIN_BOUND', /SERPENT_DOMAIN_BOUND/.test(da.stdout)], ['on: /сеть в пробе запрещена|Error/', /сеть в пробе запрещена|Error/.test(da.stdout)]);
  for (const net of ['off', '', undefined]) {
    const r = zapusk(net);
    est.push([`${JSON.stringify(net) ?? 'нет входа'}: код 1`, r.status === 1], [`${JSON.stringify(net) ?? 'нет входа'}: СТОП`, /СТОП/.test(r.stdout)]);
  }
  for (const plokho of ['yes', 'ON', 'true']) {
    const r = zapusk(plokho);
    est.push([`${plokho}: код 2`, r.status === 2], [`${plokho}: имя входа в stderr`, /SERPENT_DOMAIN_BOUND/.test(r.stderr)]);
  }
  return { est, da, vse: est.every(([, ok]) => ok) };
}
const pechat = (u) => [...u.est.map(([imya, ok]) => `  ${ok ? 'да ' : 'НЕТ'} ${imya}`), `  все условия пробы выполнены: ${u.vse ? 'ДА' : 'нет'}`];
const vkhodVOkruzhenie = (vkhod) => (vkhod === undefined ? {} : { SERPENT_DOMAIN_BOUND: vkhod });

const stroki = [];

// А — заглушка пробы под замком.
chistit(zhurnalZamka);
const vyvodyA = [];
const zapuskA = (vkhod) => {
  const r = zapuskKomandy(STOROZH, [ZAMOK, ZAGLUSHKA_PROBY], { SERPENT_PERVAYA: 'on', ZAMOK_ZHURNAL: zhurnalZamka, ...vkhodVOkruzhenie(vkhod) });
  vyvodyA.push(r.stdout + r.stderr);
  return r;
};
const uA = usloviyaProby(zapuskA);
stroki.push('А. Заглушка пробы (исходник из файла пробы) + замок сети первым', ...pechat(uA));
stroki.push(`  журнал замка (попытки сокетов): ${prochest(zhurnalZamka).length} — ${prochest(zhurnalZamka).length ? 'ПОДМЕНА НЕ ДЕРЖИТ' : 'пусто, подмена держит'}`);
stroki.push(`  «сеть в пробе запрещена» в выводе хоть одного прогона: ${vyvodyA.some((t) => t.includes('сеть в пробе запрещена')) ? 'да' : 'НЕТ — первая половина регулярки пробы мертва'}`);
stroki.push('  вывод при on:', ...uA.da.stdout.trim().split('\n').map((s) => `    ${s}`));

// Б — без заглушки, только замок, ошибка без кода.
chistit(zhurnalZamka);
const zapuskB = (vkhod) => zapuskKomandy(STOROZH, [ZAMOK], { SERPENT_PERVAYA: 'on', ZAMOK_ZHURNAL: zhurnalZamka, ZAMOK_BEZ_KODA: '1', ...vkhodVOkruzhenie(vkhod) });
const uB = usloviyaProby(zapuskB);
stroki.push('', 'Б. БЕЗ заглушки пробы — настоящий fetch, его останавливает только замок (ошибка сокета без кода)', ...pechat(uB));
stroki.push(`  журнал замка — куда шла команда (${prochest(zhurnalZamka).length} попыток за 7 прогонов):`, ...[...new Set(prochest(zhurnalZamka))].map((s) => `    ${s}`));
stroki.push('  вывод при on:', ...uB.da.stdout.trim().split('\n').map((s) => `    ${s}`));

// Г — заглушка с ошибкой настоящего таймаута fetch.
chistit(zhurnalZamka);
const zapuskG = (vkhod) => zapuskKomandy(STOROZH, [ZAMOK, ZAGLUSHKA_TAJMAUT], { SERPENT_PERVAYA: 'on', ZAMOK_ZHURNAL: zhurnalZamka, ...vkhodVOkruzhenie(vkhod) });
const uG = usloviyaProby(zapuskG);
stroki.push('', 'Г. Заглушка, бросающая DOMException TimeoutError (так отказывает настоящий fetch по AbortSignal.timeout)', ...pechat(uG));
stroki.push(`  журнал замка: ${prochest(zhurnalZamka).length} попыток`);
stroki.push('  вывод при on:', ...uG.da.stdout.trim().split('\n').map((s) => `    ${s}`));

// В — порча: запрос в сеть до проверки входа.
const iskhodnik = readFileSync(STOROZH, 'utf8');
const eol = iskhodnik.includes('\r\n') ? '\r\n' : '\n';
const s = iskhodnik.split(eol);
const i = s.findIndex((x) => x.includes('const soglasen = soglasieIzVkhoda(process.env.SERPENT_DOMAIN_BOUND);'));
const zhdom = i >= 0 && s[i + 1].includes('if (soglasen === null) {') && s[i + 4].trim() === '}' && s[i + 5].includes('r = await domen({ poluchit: poluchitSetyu') && s[i + 5].includes(', soglasen });');
if (!zhdom) throw new Error('ветка domen сторожа не та, что ждёт порча');
const porcha = [...s.slice(0, i + 1), s[i + 5].replace(', soglasen });', ', soglasen: soglasen === true });'), ...s.slice(i + 1, i + 5), ...s.slice(i + 6)];
mkdirSync(join(PAPKA, 'porcha'), { recursive: true });
const STOROZH_PORCHA = join(PAPKA, 'porcha', 'storozha-vykladki.mjs');
writeFileSync(STOROZH_PORCHA, porcha.join(eol));
const zaprosov = {};
const zapuskV = (vkhod) => {
  chistit(zhurnalPerekhvata);
  const r = zapuskKomandy(STOROZH_PORCHA, [ZAMOK, PEREKHVAT], { SERPENT_PERVAYA: 'on', ZAMOK_ZHURNAL: zhurnalZamka, PEREKHVAT_ZHURNAL: zhurnalPerekhvata, ...vkhodVOkruzhenie(vkhod) });
  zaprosov[JSON.stringify(vkhod) ?? 'нет входа'] = prochest(zhurnalPerekhvata);
  return r;
};
chistit(zhurnalZamka);
const uV = usloviyaProby(zapuskV);
stroki.push('', `В. Порча (копия сторожа вне репозитория: domen до проверки входа, код 2 — после): ${STOROZH_PORCHA}`);
stroki.push('  порча — строки ветки domen:', ...porcha.slice(i - 1, i + 6).map((x) => `    ${x.replace(/\r$/, '')}`));
stroki.push(...pechat(uV));
for (const [k, v] of Object.entries(zaprosov)) stroki.push(`  вход ${k}: запросов fetch до выхода — ${v.length}${v.length ? ` (${v.join('; ')})` : ''}`);
stroki.push(`  журнал замка: ${prochest(zhurnalZamka).length} попыток сокетов (перехват fetch стоит до замка)`);

vyvod('o4-vyvod.txt', stroki);
