// Подмена fetch (подгрузка --import) для образцов скептика SV23-O: каждый вызов — строка «fetch <адрес>» в журнал
// PEREKHVAT_ZHURNAL, затем та же ошибка, что у заглушки пробы; настоящий fetch не зовётся.
import { appendFileSync } from 'node:fs';

const zhurnal = process.env.PEREKHVAT_ZHURNAL;
globalThis.fetch = async (adres) => {
  if (zhurnal) appendFileSync(zhurnal, `fetch ${adres}\n`);
  throw new Error('сеть в пробе запрещена');
};
