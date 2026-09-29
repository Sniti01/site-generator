// Дочерний процесс замера SV23-O2: настоящий fetch сторожа (poluchitSetyu) и sostoyanieHosta против серверов на петле
// 127.0.0.1 (порты — из argv). NODE_EXTRA_CA_CERTS задаёт родитель: корни проб, чтобы цепочки дошли до своих ошибок.
// Ни одного запроса наружу: адреса — только https://127.0.0.1:<порт>/.
import { pathToFileURL } from 'node:url';

const SV = await import(pathToFileURL('D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/storozha-vykladki.mjs').href);
const sluchai = JSON.parse(process.argv[2]);
const itog = [];
for (const { imya, port } of sluchai) {
  const adres = `https://127.0.0.1:${port}/`;
  if (!adres.startsWith('https://127.0.0.1:')) throw new Error('только петля');
  const syroy = await SV.poluchitSetyu(adres);
  const s = await SV.sostoyanieHosta(SV.poluchitSetyu, `127.0.0.1:${port}`);
  itog.push({ imya, kod: syroy.oshibka ?? `ответ ${syroy.status}`, sostoyanie: s.sostoyanie, sertifikat: Boolean(s.sertifikat), pochemu: s.pochemu });
}
process.stdout.write(JSON.stringify(itog));
