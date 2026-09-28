// Подмена fetch для прогона `storozha-vykladki.mjs domen` командой — БЕЗ СЕТИ. Ответы — из переменной MOCK_OTVETY
// (JSON: url → {status, telo, location} | {oshibka}). Запрос вне образца — исключение (как в пробах сторожа).
const karta = JSON.parse(process.env.MOCK_OTVETY ?? '{}');
globalThis.fetch = async (url) => {
  const o = karta[String(url)];
  if (!o) throw new Error(`запрос вне образца: ${url}`);
  if (o.oshibka) {
    const e = new TypeError('fetch failed');
    e.cause = { code: o.oshibka };
    throw e;
  }
  return { status: o.status, headers: { get: (h) => (h.toLowerCase() === 'location' ? o.location || null : null) }, text: async () => o.telo ?? '' };
};
