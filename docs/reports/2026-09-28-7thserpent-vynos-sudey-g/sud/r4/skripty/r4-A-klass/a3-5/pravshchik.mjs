import { readFileSync, writeFileSync } from 'node:fs';
const s = readFileSync("C:\\Users\\MSI\\AppData\\Local\\Temp\\claude\\d--SEO-cloud-site-generator\\65dd1ec1-d282-489e-807d-18603cf0e02f\\scratchpad\\r4\\r4-A-klass\\a3-5\\text\\extract.mjs", 'utf8');
if (!s.includes("new Set(['script', 'style', 'template'])")) throw new Error('нет строки');
writeFileSync("C:\\Users\\MSI\\AppData\\Local\\Temp\\claude\\d--SEO-cloud-site-generator\\65dd1ec1-d282-489e-807d-18603cf0e02f\\scratchpad\\r4\\r4-A-klass\\a3-5\\text\\extract.mjs", s.replace("new Set(['script', 'style', 'template'])", "new Set(['script', 'template'])"));
