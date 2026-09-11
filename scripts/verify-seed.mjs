import { readFileSync } from 'fs';
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/).filter(l => l.includes('=')).map(l => {
      const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)];
    })
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const tables = ['users','farmers','animals','symptom_reports','outbreak_flags','lab_cases','health_records','advisories','community_posts','notification_log','chatbot_sessions','chatbot_messages'];
for (const t of tables) {
  const res = await fetch(`${url}/rest/v1/${t}?select=*&limit=1000`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) { console.log(`${t} ERROR ${res.status}`); continue; }
  const rows = await res.json();
  console.log(`${t} = ${rows.length}`);
}
// symptom report disease patterns
const flags = await (await fetch(`${url}/rest/v1/outbreak_flags?select=*&limit=1000`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })).json();
for (const f of flags) console.log(`flag: ${f.predicted_disease} / ${f.risk_level} / ${f.district} / sev=${f.severity_score}`);
const cases = await (await fetch(`${url}/rest/v1/lab_cases?select=*&limit=1000`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })).json();
for (const c of cases) console.log(`lab_case: ${c.sample_id} / ${c.status} / hist=${JSON.stringify(c.status_history)}`);
const users = await (await fetch(`${url}/rest/v1/users?select=email,role,district&limit=1000`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })).json();
for (const u of users) console.log(`user: ${u.email} / ${u.role} / ${u.district}`);
