// Нулевая точка: образец здорового сайта — все проверки ok (как проба «здоровый живой сайт»).
import { progon, vyvesti, stroka } from './obshchee.mjs';

const r = await progon();
vyvesti('h0', [`здоровый образец: ${r.itog}`, ...r.plokho.map(stroka), ...r.spravki.map((s) => `  справка: ${s}`)]);
