// Проверка замка сети на петле: свой TCP-приёмник на 127.0.0.1 считает соединения. Контроль без замка — соединения
// приходят (способ их видит); с замком — ни одного, в журнале замка — две строки (http и https). Адрес — петля:
// наружу ни пакета. Только при «замок держит» образцы с настоящим fetch под замком допустимы.
import net from 'node:net';
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { PAPKA, adresFajla, vyvod } from './obshchee-o.mjs';

let soedineniy = 0;
const priyomnik = net.createServer((s) => {
  soedineniy += 1;
  s.destroy();
});
await new Promise((ok) => priyomnik.listen(0, '127.0.0.1', ok));
const port = priyomnik.address().port;
const rebenok = join(PAPKA, 'zamok-rebenok.mjs');
const zhurnal = join(PAPKA, 'proverka-zamka-zhurnal.txt');
const zapusk = (podgruzki) =>
  new Promise((ok) => {
    const p = spawn(process.execPath, [...podgruzki.flatMap((x) => ['--import', x]), rebenok, String(port)], { env: { ...process.env, ZAMOK_ZHURNAL: zhurnal } });
    let tekst = '';
    p.stdout.on('data', (d) => {
      tekst += d;
    });
    p.stderr.on('data', (d) => {
      tekst += d;
    });
    p.on('close', (kod) => ok({ kod, tekst }));
  });

const stroki = [`приёмник: 127.0.0.1:${port}`];
if (existsSync(zhurnal)) rmSync(zhurnal);
soedineniy = 0;
const kontrol = await zapusk([]);
const uKontrolya = soedineniy;
stroki.push(`контроль без замка: код ${kontrol.kod}; соединений у приёмника ${uKontrolya}`, kontrol.tekst.trim());
soedineniy = 0;
const podZamkom = await zapusk([adresFajla(join(PAPKA, 'zamok-seti.mjs'))]);
const uZamka = soedineniy;
const zap = existsSync(zhurnal) ? readFileSync(zhurnal, 'utf8').trim() : '';
stroki.push(`с замком: код ${podZamkom.kod}; соединений у приёмника ${uZamka}`, podZamkom.tekst.trim(), 'журнал замка:', zap || '(пусто)');
const derzhit = uKontrolya > 0 && uZamka === 0 && zap.split('\n').filter(Boolean).length === 2;
stroki.push(`ИТОГ: ${derzhit ? 'замок держит — контроль видит соединения, под замком ни одного, обе попытки записаны' : 'ЗАМОК НЕ ДЕРЖИТ — образцы с настоящим fetch не запускать'}`);
priyomnik.close();
vyvod('proverka-zamka-vyvod.txt', stroki);
