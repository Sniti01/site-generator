// node vyrezka.mjs <src.png> <dst.png> <x> <y> <w> <h> <масштаб> — вырезка с увеличением (ближайший сосед), PNG RGB
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';
import { decodePng } from '../../../../core/accept/pixels.mjs';
const [, , src, dst, xs, ys, ws, hs, ks] = process.argv;
const [x0, y0, w, h, k] = [xs, ys, ws, hs, ks].map(Number);
const im = decodePng(readFileSync(src));
const ch = im.data.length / (im.width * im.height);
const W = w * k, H = h * k;
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let Y = 0; Y < H; Y++) {
  raw[Y * (W * 3 + 1)] = 0;
  for (let X = 0; X < W; X++) {
    const sx = x0 + Math.floor(X / k), sy = y0 + Math.floor(Y / k);
    const i = (sy * im.width + sx) * ch;
    const o = Y * (W * 3 + 1) + 1 + X * 3;
    raw[o] = im.data[i]; raw[o + 1] = im.data[i + 1]; raw[o + 2] = im.data[i + 2];
  }
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, c]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
writeFileSync(dst, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(`${dst}: ${W}×${H}`);
