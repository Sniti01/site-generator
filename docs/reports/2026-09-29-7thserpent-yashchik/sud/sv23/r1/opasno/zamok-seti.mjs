// Замок сети (подгрузка --import) для образцов скептика SV23-O. Всякое соединение Node — TCP и TLS — открывает
// net.Socket.prototype.connect, и запрос имени в DNS идёт уже внутри него; замок подменяет его: строка в журнал
// ZAMOK_ZHURNAL и ошибка сокета в следующем тике. Ни запроса имени, ни пакета наружу. Запросы имени напрямую
// (dns.lookup) — тоже в журнал и ошибка. ZAMOK_BEZ_KODA=1 — ошибка без поля code.
import net from 'node:net';
import dns from 'node:dns';
import { appendFileSync } from 'node:fs';

const zhurnal = process.env.ZAMOK_ZHURNAL;
const zapisat = (s) => {
  if (zhurnal) appendFileSync(zhurnal, `${s}\n`);
};
const oshibkaZamka = (gde) => {
  const e = new Error(`замок сети: ${gde}`);
  if (process.env.ZAMOK_BEZ_KODA !== '1') e.code = 'ZAMOK_SETI';
  return e;
};

net.Socket.prototype.connect = function zamokSoedineniya(...argi) {
  let o = argi[0];
  if (Array.isArray(o)) o = o[0];
  if (!o || typeof o !== 'object') o = { port: argi[0], host: argi[1] };
  zapisat(`сокет ${o.host ?? o.path ?? '?'}:${o.port ?? ''}`);
  const e = oshibkaZamka('соединение не открыто');
  process.nextTick(() => this.destroy(e));
  return this;
};

for (const imya of ['lookup', 'resolve', 'resolve4', 'resolve6', 'resolveAny']) {
  dns[imya] = (...argi) => {
    zapisat(`имя ${argi[0]}`);
    throw oshibkaZamka('имя');
  };
  dns.promises[imya] = async (...argi) => {
    zapisat(`имя ${argi[0]}`);
    throw oshibkaZamka('имя');
  };
}
