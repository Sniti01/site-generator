// Запись регистратора → материалы доклада: node obrezat-zapis.mjs <otvety-….json> <выход.json>
// У каждого ответа — адрес, время, статус, заголовки, Set-Cookie, длина и sha256 тела; тела robots.txt и карт —
// строкой UTF-8 (байты — по sha256); тела HTML не кладутся (страница = сборка, справка прогона; sha256 и длина есть).
import { readFileSync, writeFileSync } from 'node:fs';

const vkhod = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const zapisi = vkhod.zapisi.map((z) => {
  if (z.oshibka) return z;
  const { teloBase64, ...ostalnoe } = z;
  const tip = z.zagolovki.find(([k]) => k === 'content-type')?.[1] ?? '';
  return /^(text\/plain|application\/xml|text\/xml)/i.test(tip) ? { ...ostalnoe, telo: Buffer.from(teloBase64, 'base64').toString('utf8') } : ostalnoe;
});
writeFileSync(process.argv[3], JSON.stringify({ zapisano: vkhod.zapisano, zapisey: zapisi.length, zapisi }, null, 2) + '\n');
console.log(`ответов ${zapisi.length}, с телом ${zapisi.filter((z) => 'telo' in z).length}`);
