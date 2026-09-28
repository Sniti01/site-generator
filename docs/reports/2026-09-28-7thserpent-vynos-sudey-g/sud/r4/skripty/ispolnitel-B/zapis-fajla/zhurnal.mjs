export default async function* (source) {
  yield `argv ${JSON.stringify(process.argv.slice(2))} execArgv ${JSON.stringify(process.execArgv)}\n`;
  for await (const e of source) if (e.type === 'test:pass' || e.type === 'test:fail') yield `${e.type} ${JSON.stringify(e.data?.name)} file=${JSON.stringify(e.data?.file)} nesting=${e.data?.nesting} ${e.data?.details?.type ?? ''}\n`;
}
