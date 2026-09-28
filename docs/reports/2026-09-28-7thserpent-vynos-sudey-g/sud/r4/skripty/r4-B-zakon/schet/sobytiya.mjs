// Репортёр-самописец: события test:pass / test:fail — строкой каждое (имя, тип, skip, todo, failureType, код node не трогает).
export default async function* sobytiya(source) {
  for await (const e of source) {
    if (e.type !== 'test:pass' && e.type !== 'test:fail') continue;
    const d = e.data ?? {};
    yield `${e.type} имя=${JSON.stringify(String(d.name).slice(-40))} тип=${d.details?.type} skip=${JSON.stringify(d.skip)} todo=${JSON.stringify(d.todo)} failureType=${d.details?.error?.failureType}\n`;
  }
}
