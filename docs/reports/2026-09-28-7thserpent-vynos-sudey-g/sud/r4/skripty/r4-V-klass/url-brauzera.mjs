// Как URL-разборщик WHATWG (Node — та же спецификация, что у браузера) сводит адреса проб V3-4:
// таб и перевод строки выбрасываются; неполная процентная запись в запросе и фрагменте пути не трогает.
const BAZA = 'https://www.7thserpent.com/remake/';
for (const a of ['/_ast\tro/mp3-k15.abc.webp', '/_as\ntro/mp3-k15.abc.webp', '/%5Fastro/mp3-k15.abc.webp?%', '/%5Fastro/mp3-k15.abc.webp#%zz']) {
  const u = new URL(a, BAZA);
  let dec;
  try {
    dec = decodeURIComponent(a);
  } catch (e) {
    dec = `исключение ${e.name} — сверка берёт строку как есть`;
  }
  console.log(JSON.stringify(a), '→ путь', u.pathname, '| decodeURIComponent:', JSON.stringify(dec));
}
