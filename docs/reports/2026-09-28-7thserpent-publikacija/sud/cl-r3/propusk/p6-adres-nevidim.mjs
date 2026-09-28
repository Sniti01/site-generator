// CL3-P-6: «адрес ящика открытым текстом» — vidimyyTekst снимает комментарии, script/style/template и теги, но не
// <head> (<title>), не <noscript> (у читателя со скриптами не показывается), не элементы с атрибутом hidden. Страница
// /privacy/ (и сборка — живой HTML ей равен), где строки ящика в тексте страницы нет, а адрес есть только там.
import { progon, vyvesti, stroka, otvet, stranica, B, HTML, YASHCHIK } from './obshchee.mjs';

const ADRES = '/privacy/: адрес ящика открытым текстом';
const out = [];
for (const [imya, html] of [
  ['адрес только в <title>', stranica('/privacy/', `Privacy policy — ${YASHCHIK}`, '<p>Requests about the hosting logs go to the owner.</p>')],
  ['адрес только в <p hidden>', stranica('/privacy/', 'Privacy policy — 7thserpent.com', `<p>Requests about the hosting logs go to the owner.</p><p hidden>${YASHCHIK}</p>`)],
  ['адрес только в <noscript>', stranica('/privacy/', 'Privacy policy — 7thserpent.com', `<p>Requests about the hosting logs go to the owner.</p><noscript>${YASHCHIK}</noscript>`)],
  ['контроль — адреса нет нигде', stranica('/privacy/', 'Privacy policy — 7thserpent.com', '<p>Requests about the hosting logs go to the owner.</p>')],
]) {
  const r = await progon(() => {}, { vSborke: (k) => k.set(`${B}/privacy/`, otvet(200, html, HTML)) });
  out.push(`— ${imya} (и в сборке) —`);
  out.push(`итог инструмента: ${r.itog}`);
  out.push(stroka(r.najti(ADRES)));
}
vyvesti('p6-adres-nevidim', out);
