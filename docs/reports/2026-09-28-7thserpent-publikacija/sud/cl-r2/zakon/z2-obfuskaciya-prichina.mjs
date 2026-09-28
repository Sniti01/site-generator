// CL2-Z-2: адрес на /privacy/ есть, но Cloudflare Email Address Obfuscation включена (так было у первого сайта, П77 п. 6):
// строка «адрес ящика открытым текстом» называет причиной порядок запуска («адреса нет — ящик до привязки домена»),
// а не переключатель. Разметка Cloudflare — как у первого сайта (__cf_email__, data-cfemail, email-decode.min.js).
import { progon, pechat, B, YASHCHIK } from './stend.mjs';

const SKRIPT = '<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>';
const obf = (forma) => (url, o) => {
  if (url !== `${B}/privacy/`) return undefined;
  const body =
    forma === 'ssylka'
      ? o.body.replace(`<a href="mailto:${YASHCHIK}">${YASHCHIK}</a>`, '<a href="/cdn-cgi/l/email-protection#7d121a1d"><span class="__cf_email__" data-cfemail="1f707d7a">[email&#160;protected]</span></a>')
      : o.body.replace(YASHCHIK, '<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="1f707d7a">[email&#160;protected]</a>');
  return { ...o, body: body.replace('</body>', `${SKRIPT}</body>`) };
};
const itog = [];
for (const [imya, v] of [
  ['a) адрес ссылкой mailto, обфускация включена', { pravka: obf('ssylka') }],
  ['b) адрес текстом (форма первого сайта), обфускация включена', { privacyForma: 'tekst', pravka: obf('tekst') }],
]) {
  const r = await progon(v);
  pechat(imya, r);
  const c = r.proverki.find((x) => x.imya.startsWith('/privacy/: адрес ящика'));
  itog.push(`${imya.slice(0, 2)} «${c.otkuda}»`);
}
console.log(`\nИТОГ Z2: ${itog.join('; ')}`);
