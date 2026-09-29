// SV23-O2 · «запусти снова / повтори запуск» после правки SV23-O-6: Re-run (попытка ≥ 2) теперь идёт без согласия, а
// советы стопов papka, indeks, glubina и ветки согласия сторожа домена по-прежнему зовут «запустить снова». Раунд 1
// (скептик «законные формы») записал «повтор после стопа indeks сохраняет входы» как держит — для согласия это больше
// не так. Цепочка — функции сторожа над образцами; значение входа во второй попытке — по выражению workflow
// (github.run_attempt == 1 && inputs.SERPENT_DOMAIN_BOUND || 'off'; модель — o2-povtor.mjs). Сети нет.
import { SV, W, G, otv, oshibka, iz, vyvod, ZAGLUSHKA } from './obshchee-o2.mjs';

const vkhodShagu = (popytka, vkhod) => (Number(popytka) === 1 && vkhod ? vkhod : 'off');
const S403 = '<html><head><title>403 Forbidden</title></head><body><h1>Forbidden</h1></body></html>';
const stroki = ['Советы «снова / повтори» в стопах (функции сторожа над образцами):'];
const sovety = [
  ['indeks: пустой index.html', SV.indeks('').stroki.at(-1)],
  ['papka: только имена сборки без index.html', SV.papka('.htaccess\nfavicon.ico\n', null, ['.htaccess', 'favicon.ico', 'index.html']).stroki.at(-1)],
  ['glubina: find с ошибками', SV.glubina('./\n', null, [], null, 'find: Permission denied').stroki.at(-1)],
  ['domen со входом: таймаут', (await SV.domen({ poluchit: iz({ [W]: oshibka('TimeoutError'), [G]: oshibka('TimeoutError') }), pervyi: true, soglasen: true })).stroki.at(-1)],
  ['domen со входом: ошибка сертификата', (await SV.domen({ poluchit: iz({ [W]: oshibka('CERT_HAS_EXPIRED'), [G]: oshibka('CERT_HAS_EXPIRED') }), pervyi: true, soglasen: true })).stroki.at(-1)],
];
for (const [imya, s] of sovety) stroki.push(`  ${imya}: ${s}`);
stroki.push('');

stroki.push('Цепочка первой выкладки (П108: Run workflow, SERPENT_FIRST = on, SERPENT_DOMAIN_BOUND = on):');
const p1 = SV.indeks(ZAGLUSHKA);
stroki.push(`  попытка 1: indeks над заглушкой хостера — ${p1.ok ? 'проход' : 'СТОП'}: ${p1.stroki.at(-1)}`);
stroki.push('  владелец удаляет заглушку; домен на обоих именах — 403 пустого каталога; владелец жмёт Re-run (попытка 2)');
const v2 = vkhodShagu('2', 'on');
const r2 = await SV.domen({ poluchit: iz({ [W]: otv(403, S403), [G]: otv(403, S403) }), pervyi: true, soglasen: SV.soglasieIzVkhoda(v2) });
stroki.push(`  попытка 2: вход шагу домена — ${JSON.stringify(v2)}; сторож домена — ${r2.ok ? 'проход' : 'СТОП'}: ${r2.stroki.at(-1)}`);
const v3 = vkhodShagu('1', 'on');
const r3 = await SV.domen({ poluchit: iz({ [W]: otv(403, S403), [G]: otv(403, S403) }), pervyi: true, soglasen: SV.soglasieIzVkhoda(v3) });
stroki.push(`  новый запуск Run workflow (попытка 1): вход — ${JSON.stringify(v3)}; сторож домена — ${r3.ok ? 'проход' : 'СТОП'}`);
stroki.push('');
stroki.push('Вывод: исход безопасен (стоп), но каждый совет «снова/повтори» без слов «новый запуск Run workflow со входами» ведёт');
stroki.push('владельца в лишний круг: Re-run — самый короткий путь после стопа, а согласие он больше не несёт.');
vyvod('o2-snova-vyvod.txt', stroki);
