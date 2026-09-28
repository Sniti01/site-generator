// Где разборщик без скриптов закрывает <noscript>: есть ли endTag у элемента.
import { razobrat, elementy, imya } from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs';

const sluchai = {
  'обычный': '<p class="t-label"><noscript>Game</noscript></p>',
  'p закрывает p': '<div class="t-label"><p><noscript><p>Game · 2001</noscript></p></div>',
  'div закрывает': '<div><noscript>x</div>y</noscript>',
  'внутри p без блока': '<p><noscript><b>x</b></noscript></p>',
  'вложенный': '<noscript><noscript>x</noscript>y</noscript>',
  'конец файла': '<p><noscript>x',
  'в голове, p': '</head><body>',
};
for (const [k, h] of Object.entries(sluchai)) {
  const d = razobrat(`<!doctype html><html><head><title>t</title>${k === 'в голове, p' ? '<noscript><p>q</noscript>' : ''}</head><body><main>${h}</main></body></html>`);
  const ns = elementy(d).filter((u) => imya(u) === 'noscript');
  console.log(k, JSON.stringify(ns.map((u) => ({ start: u.sourceCodeLocation?.startTag?.startOffset, konec: u.sourceCodeLocation?.endOffset, endTag: Boolean(u.sourceCodeLocation?.endTag) }))));
}
