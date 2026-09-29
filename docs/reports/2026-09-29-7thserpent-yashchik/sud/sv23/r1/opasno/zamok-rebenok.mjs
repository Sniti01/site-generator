// Ребёнок проверки замка: два fetch к петле 127.0.0.1:<порт> — http и https; печать итога каждого.
const port = process.argv[2];
const stroki = [];
for (const adres of [`http://127.0.0.1:${port}/`, `https://127.0.0.1:${port}/`]) {
  try {
    const r = await fetch(adres, { signal: AbortSignal.timeout(5000) });
    stroki.push(`${adres} — ответ ${r.status}`);
  } catch (e) {
    stroki.push(`${adres} — ${e.name}; причина: ${e.cause?.code ?? '—'} ${e.cause?.message ?? e.message}`);
  }
}
console.log(stroki.join('\n'));
