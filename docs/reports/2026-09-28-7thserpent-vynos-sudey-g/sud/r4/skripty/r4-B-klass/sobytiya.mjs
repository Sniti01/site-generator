// Репортёр-журнал: тип события, имя, файл — чтобы увидеть, что parent получает от файла, вышедшего process.exit(0).
export default async function* sobytiya(source) {
  for await (const e of source) {
    if (['test:enqueue', 'test:dequeue', 'test:start', 'test:pass', 'test:fail', 'test:complete'].includes(e.type)) {
      yield `${e.type} ${JSON.stringify(e.data?.name)} nesting=${e.data?.nesting} ${e.data?.details?.type ?? ''}\n`;
    }
  }
}
