// SV23-O2 · шаблон SERTIFIKAT правки раунда 1 (SV23-O-1, Z-1):
//   /^(ERR_TLS_|ERR_SSL_|CERT_|DEPTH_ZERO_|SELF_SIGNED_|UNABLE_TO_|HOSTNAME_MISMATCH)/
// Часть 1 — перечень кодов проверки сертификата Node (tls.md «X509 certificate error codes» и запасной UNSPECIFIED для
// кода вне перечня) и кодов протокола TLS и сети — через sostoyanieHosta с подставным poluchit: кто получает причину
// «ошибка сертификата» и совет «Let's Encrypt в панели хостера», а кто — «ошибка сети — повтори, проверь DNS».
// Часть 2 — замер: настоящий fetch сторожа (poluchitSetyu) против серверов на петле 127.0.0.1 с сертификатами openssl
// (папка tls/ этой папки); дочерний процесс — o2-tls-rebenok.mjs. Живой домен не трогается.
import { spawnSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import https from 'node:https';
import http from 'node:http';
import { join } from 'node:path';
import { PAPKA, SV, vyvod } from './obshchee-o2.mjs';

const stroki = [];
const klass = async (kod) => Boolean((await SV.sostoyanieHosta(async () => ({ oshibka: kod }), 'www.7thserpent.com')).sertifikat);

// ---- часть 1 ----
const X509 = ['UNABLE_TO_GET_ISSUER_CERT', 'UNABLE_TO_GET_CRL', 'UNABLE_TO_DECRYPT_CERT_SIGNATURE', 'UNABLE_TO_DECRYPT_CRL_SIGNATURE', 'UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY', 'CERT_SIGNATURE_FAILURE', 'CRL_SIGNATURE_FAILURE', 'CERT_NOT_YET_VALID', 'CERT_HAS_EXPIRED', 'CRL_NOT_YET_VALID', 'CRL_HAS_EXPIRED', 'ERROR_IN_CERT_NOT_BEFORE_FIELD', 'ERROR_IN_CERT_NOT_AFTER_FIELD', 'ERROR_IN_CRL_LAST_UPDATE_FIELD', 'ERROR_IN_CRL_NEXT_UPDATE_FIELD', 'OUT_OF_MEM', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_CHAIN_TOO_LONG', 'CERT_REVOKED', 'INVALID_CA', 'PATH_LENGTH_EXCEEDED', 'INVALID_PURPOSE', 'CERT_UNTRUSTED', 'CERT_REJECTED', 'HOSTNAME_MISMATCH', 'UNSPECIFIED'];
const PROTOKOL = ['ERR_SSL_WRONG_VERSION_NUMBER', 'ERR_SSL_PACKET_LENGTH_TOO_LONG', 'ERR_SSL_TLSV1_ALERT_PROTOCOL_VERSION', 'ERR_SSL_SSLV3_ALERT_HANDSHAKE_FAILURE', 'ERR_SSL_TLSV13_ALERT_CERTIFICATE_REQUIRED', 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR', 'ERR_SSL_TLSV1_UNRECOGNIZED_NAME', 'ECONNRESET', 'ECONNREFUSED', 'UND_ERR_SOCKET', 'UND_ERR_CONNECT_TIMEOUT'];
stroki.push('Часть 1 — классификация кодов сторожем (sostoyanieHosta, подставной poluchit):');
const vne = [];
for (const k of X509) if (!(await klass(k))) vne.push(k);
stroki.push(`  коды проверки сертификата Node ВНЕ шаблона (причина «ошибка сети — повтори; проверь DNS»): ${vne.join(', ')}`);
const vnutri = [];
for (const k of PROTOKOL) if (await klass(k)) vnutri.push(k);
stroki.push(`  коды протокола TLS (не сертификат сайта) В шаблоне (причина «ошибка сертификата — браузер откроет только с предупреждением», совет — Let's Encrypt): ${vnutri.join(', ')}`);
stroki.push('');

// ---- часть 2: сертификаты openssl ----
const TLS = join(PAPKA, 'tls');
mkdirSync(TLS, { recursive: true });
const f = (imya) => join(TLS, imya).replace(/\\/g, '/');
const ossl = (args) => {
  const r = spawnSync('openssl', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`openssl ${args.join(' ')}: ${r.stderr}`);
};
const koren = (imya, ogr) => ossl(['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', f(`${imya}.key`), '-out', f(`${imya}.pem`), '-days', '2', '-subj', `/CN=${imya}`, '-addext', `basicConstraints=critical,${ogr}`, '-addext', 'keyUsage=critical,keyCertSign,cRLSign']);
const vypusk = (imya, ca, n, ext, sroki = ['-days', '2']) => {
  writeFileSync(f(`${imya}.ext`), ext);
  ossl(['req', '-newkey', 'rsa:2048', '-nodes', '-keyout', f(`${imya}.key`), '-out', f(`${imya}.csr`), '-subj', `/CN=${imya}`]);
  ossl(['x509', '-req', '-in', f(`${imya}.csr`), '-CA', f(`${ca}.pem`), '-CAkey', f(`${ca}.key`), '-set_serial', String(n), ...sroki, '-out', f(`${imya}.pem`), '-extfile', f(`${imya}.ext`)]);
};
const LIST = 'subjectAltName=IP:127.0.0.1\nbasicConstraints=CA:FALSE\nextendedKeyUsage=serverAuth\n';
koren('koren', 'CA:TRUE');
koren('koren2', 'CA:TRUE,pathlen:0');
ossl(['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', f('sam.key'), '-out', f('sam.pem'), '-days', '2', '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1']);
vypusk('verno', 'koren', 10, LIST);
vypusk('chuzhoe-imya', 'koren', 11, 'subjectAltName=DNS:example.test\nbasicConstraints=CA:FALSE\nextendedKeyUsage=serverAuth\n');
vypusk('ne-ca', 'koren', 12, 'basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyCertSign\n');
vypusk('list-ne-ca', 'ne-ca', 13, LIST);
vypusk('naznachenie', 'koren', 14, 'subjectAltName=IP:127.0.0.1\nbasicConstraints=CA:FALSE\nextendedKeyUsage=clientAuth\n');
vypusk('promezh', 'koren2', 15, 'basicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\n');
vypusk('list-promezh', 'promezh', 16, LIST);
let prosrochen = true;
try {
  vypusk('prosrochen', 'koren', 17, LIST, ['-not_before', '20200101000000Z', '-not_after', '20200102000000Z']);
} catch (e) {
  prosrochen = false;
  stroki.push(`(просроченный сертификат не выпущен: ${String(e.message).split('\n')[0]})`);
}
writeFileSync(f('korni.pem'), readFileSync(f('koren.pem'), 'utf8') + readFileSync(f('koren2.pem'), 'utf8'));

// ---- часть 2: серверы на петле и дочерний замер ----
const chitat = (imya) => readFileSync(f(imya), 'utf8');
const obrabotka = (zapros, otvet) => {
  otvet.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  otvet.end('<!DOCTYPE html><html><head><title>Поздравляем, сайт создан!</title></head></html>');
};
const SERVERY = [
  ['контроль: верная цепочка (корень проб — в NODE_EXTRA_CA_CERTS)', () => https.createServer({ key: chitat('verno.key'), cert: chitat('verno.pem') }, obrabotka)],
  ['сертификат на другое имя (DNS:example.test)', () => https.createServer({ key: chitat('chuzhoe-imya.key'), cert: chitat('chuzhoe-imya.pem') }, obrabotka)],
  ['самоподписанный', () => https.createServer({ key: chitat('sam.key'), cert: chitat('sam.pem') }, obrabotka)],
  ['промежуточный без CA:TRUE', () => https.createServer({ key: chitat('list-ne-ca.key'), cert: chitat('list-ne-ca.pem') + chitat('ne-ca.pem') }, obrabotka)],
  ['лист только для clientAuth (не serverAuth)', () => https.createServer({ key: chitat('naznachenie.key'), cert: chitat('naznachenie.pem') }, obrabotka)],
  ['корень pathlen:0, под ним промежуточный CA', () => https.createServer({ key: chitat('list-promezh.key'), cert: chitat('list-promezh.pem') + chitat('promezh.pem') }, obrabotka)],
  ...(prosrochen ? [['просроченный (2020-01-01…02)', () => https.createServer({ key: chitat('prosrochen.key'), cert: chitat('prosrochen.pem') }, obrabotka)]] : []),
  ['на порту https — простой http (TLS на имени не настроен)', () => http.createServer(obrabotka)],
  ['сервер требует сертификат КЛИЕНТА (у сайта сертификат верный)', () => https.createServer({ key: chitat('verno.key'), cert: chitat('verno.pem'), requestCert: true, rejectUnauthorized: true, ca: chitat('koren.pem') }, obrabotka)],
];
const zapushcheny = [];
for (const [imya, sozdat] of SERVERY) {
  const srv = sozdat();
  await new Promise((gotovo) => srv.listen(0, '127.0.0.1', gotovo));
  zapushcheny.push({ imya, srv, port: srv.address().port });
}
const rebenok = spawn(process.execPath, [join(PAPKA, 'o2-tls-rebenok.mjs'), JSON.stringify(zapushcheny.map(({ imya, port }) => ({ imya, port })))], { env: { ...process.env, NODE_EXTRA_CA_CERTS: f('korni.pem') } });
let vyhod = '';
let oshibki = '';
rebenok.stdout.on('data', (d) => { vyhod += d; });
rebenok.stderr.on('data', (d) => { oshibki += d; });
const kodVyhoda = await new Promise((gotovo) => rebenok.on('exit', gotovo));
for (const { srv } of zapushcheny) {
  srv.closeAllConnections?.();
  srv.close();
}
stroki.push(`Часть 2 — замер на петле (Node ${process.version}; на раннере — Node 24), код дочернего процесса ${kodVyhoda}${oshibki.trim() ? `, stderr: ${oshibki.trim().split('\n')[0]}` : ''}:`);
const zamer = vyhod ? JSON.parse(vyhod) : [];
for (const z of zamer) {
  stroki.push(`  ${z.imya}: код fetch — ${z.kod}; сторож — ${z.sostoyanie}, sertifikat=${z.sertifikat}`);
  stroki.push(`    причина: ${z.pochemu}`);
}
stroki.push('');
stroki.push('Вывод: шаблон по началу имени кода не совпадает с классом ошибки. Замерено: INVALID_PURPOSE (промежуточный без CA:TRUE,');
stroki.push('лист только для clientAuth) и PATH_LENGTH_EXCEEDED — «ошибка сети — повтори; проверь записи DNS»; простой http на порту 443');
stroki.push('(ERR_SSL_WRONG_VERSION_NUMBER) — «ошибка сертификата — браузер откроет только с предупреждением» (браузер не откроет вовсе).');
stroki.push('По перечню Node вне шаблона также INVALID_CA, ERROR_IN_CERT_NOT_*_FIELD, CRL_*, UNSPECIFIED; в шаблоне — все ERR_SSL_*');
stroki.push('протокола. Требование сертификата клиента — UND_ERR_SOCKET, «ошибка сети» (контроль). Все исходы — стоп; неверны причина и совет.');
vyvod('o2-sertifikat-vyvod.txt', stroki);
