// Замер для доклада сессии 23 (П108): что отвечает домен сейчас. Три запроса GET к главной, без редиректов,
// без cookies; печатаются статус, Location, несколько заголовков, <title> и длина тела. Ничего не отправляется,
// кроме этих запросов.
const adresa = ['https://www.7thserpent.com/', 'https://7thserpent.com/', 'http://www.7thserpent.com/'];
for (const url of adresa) {
  try {
    const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'factory-report-probe/1' } });
    const telo = await r.text();
    const zag = ['server', 'cf-ray', 'cf-cache-status', 'x-ray', 'content-type', 'cache-control', 'set-cookie', 'strict-transport-security'];
    console.log(`${url} — ${r.status}${r.headers.get('location') ? ` → ${r.headers.get('location')}` : ''}`);
    for (const z of zag) console.log(`  ${z}: ${r.headers.get(z) ?? '—'}`);
    const t = /<title>([^<]*)<\/title>/i.exec(telo)?.[1];
    console.log(`  title: ${t === undefined ? '—' : t.trim()}; тело: ${Buffer.byteLength(telo)} байт; canonical: ${/rel=["']?canonical/i.test(telo) ? 'есть' : 'нет'}`);
  } catch (e) {
    console.log(`${url} — сеть: ${e.cause?.code ?? e.name}${e.cause?.message ? ` (${e.cause.message})` : ''}`);
  }
}
