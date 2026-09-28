export default async function* (source) {
  for await (const e of source) if (e.type === 'test:pass' || e.type === 'test:fail') yield `  ${e.type} ${JSON.stringify(e.data?.name)} ${e.data?.details?.type ?? ''} ${e.data?.details?.error?.failureType ?? ''} skip=${JSON.stringify(e.data?.skip)} todo=${JSON.stringify(e.data?.todo)}\n`;
}
