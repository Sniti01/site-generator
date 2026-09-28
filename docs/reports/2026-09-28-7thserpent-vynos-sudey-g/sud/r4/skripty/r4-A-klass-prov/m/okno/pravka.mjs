import { readFileSync, writeFileSync } from 'node:fs';
const s = readFileSync("C:\\Users\\MSI\\AppData\\Local\\Temp\\claude\\d--SEO-cloud-site-generator\\65dd1ec1-d282-489e-807d-18603cf0e02f\\scratchpad\\r4\\r4-A-klass-prov\\m\\okno\\text\\words.mjs", 'utf8');
if (!s.includes("match(/[\\p{L}\\p{N}']+/gu)")) throw new Error('нет строки');
writeFileSync("C:\\Users\\MSI\\AppData\\Local\\Temp\\claude\\d--SEO-cloud-site-generator\\65dd1ec1-d282-489e-807d-18603cf0e02f\\scratchpad\\r4\\r4-A-klass-prov\\m\\okno\\text\\words.mjs", s.replace("match(/[\\p{L}\\p{N}']+/gu)", "match(/[\\p{L}']+/gu)"));
