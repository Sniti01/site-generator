// Прогоны workflow «Deploy 7thserpent.com» публичным API без токена (память: github-actions-bez-tokena):
// номер, id, коммит, событие, попытка, итог; у двух последних — шаги задания с итогами. Форма — одноимённый инструмент
// сессии 24.
const API = 'https://api.github.com/repos/Sniti01/site-generator';
const zhdat = async (u) => {
  const r = await fetch(u, { headers: { 'user-agent': 'factory-session-25', accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error(`${u}: ${r.status}`);
  return r.json();
};
const { workflow_runs: progony } = await zhdat(`${API}/actions/workflows/deploy-7thserpent.yml/runs?per_page=10`);
for (const p of progony) {
  console.log(`#${p.run_number} id ${p.id} ${p.head_sha.slice(0, 7)} ${p.event} попытка ${p.run_attempt} ${p.status}/${p.conclusion} ${p.created_at} ${p.display_title.slice(0, 60)}`);
}
for (const p of progony.slice(0, 2)) {
  const { jobs } = await zhdat(p.jobs_url);
  for (const j of jobs) {
    console.log(`\n#${p.run_number} задание «${j.name}» ${j.conclusion} ${j.started_at} → ${j.completed_at}`);
    for (const s of j.steps) console.log(`  ${String(s.number).padStart(2)} ${s.conclusion?.padEnd(8)} ${s.name}`);
  }
}
