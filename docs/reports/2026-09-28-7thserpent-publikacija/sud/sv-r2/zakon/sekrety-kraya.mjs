// SV2-Z: строгость `sekrety` к законным логину и хосту хостера и к краям значения. Сторож судит значение ПОСЛЕ trim,
// а workflow подставляет в lftp СЫРОЕ значение ("$SERPENT_FTP_USER", ftp://$SERPENT_FTP_HOST, "$SERPENT_FTP_PORT").
import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/storozha-vykladki.mjs').href);

const BAZA = { SERPENT_FTP_HOST: 'ax572417.ftp.tools', SERPENT_FTP_PORT: '21', SERPENT_FTP_USER: 'ax572417_serpent', SERPENT_FTP_PASSWORD: 'x', SERPENT_CORPUS_KEY: 'k', AC4BF_FTP_USER: 'ax572417_claude' };
const FORMY = [
  ['логин хостера ax572417_serpent (контроль)', {}],
  ['логин с @ . - _ (вида robot-2.x@7thserpent.com)', { SERPENT_FTP_USER: 'robot-2.x_y@7thserpent.com' }],
  ['логин с переводом строки в конце (вставлен из буфера)', { SERPENT_FTP_USER: 'ax572417_serpent\n' }],
  ['логин с пробелом в конце', { SERPENT_FTP_USER: 'ax572417_serpent ' }],
  ['хост с переводом строки в конце', { SERPENT_FTP_HOST: 'ax572417.ftp.tools\n' }],
  ['порт « 21\\n»', { SERPENT_FTP_PORT: ' 21\n' }],
  ['хост вставлен со схемой ftp://', { SERPENT_FTP_HOST: 'ftp://ax572417.ftp.tools' }],
  ['хост вставлен строкой доступа панели user@host:21', { SERPENT_FTP_HOST: 'ax572417_serpent@ax572417.ftp.tools:21' }],
];
for (const [imya, izm] of FORMY) {
  const env = { ...BAZA, ...izm };
  const r = S.sekrety(env);
  // что получит lftp (строка шага workflow, bash подставляет сырое значение)
  const lftp = `open --env-password -u "${env.SERPENT_FTP_USER}" -p "${env.SERPENT_FTP_PORT}" ftp://${env.SERPENT_FTP_HOST}; cls -1 -a -F; bye`;
  console.log(`[${imya}] sekrety ${r.ok ? 'ПРОХОД' : 'ОТКАЗ'} — ${r.stroki[0]} || lftp -e получит: ${JSON.stringify(lftp)}`);
}
