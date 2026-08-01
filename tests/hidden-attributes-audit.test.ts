import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const browserSurfaces = [
  "components/PlayerProfile.tsx", "components/SquadDashboard.tsx", "components/TacticsBoard.tsx",
  "components/TryoutDetail.tsx", "app/mercado/page.tsx",
];
const forbidden = ["finishing", "short_passing", "pace", "strength", "potential_ceiling", "natural_talent", "injury_proneness", "current_overall"];

test("superficies enviadas ao navegador nao referenciam atributos esportivos reais", () => {
  for (const file of browserSurfaces) {
    const source = readFileSync(file, "utf8");
    for (const key of forbidden) assert.equal(new RegExp(`\\b${key}\\b`).test(source), false, `${file} expoe ${key}`);
  }
});

test("migration revoga leitura direta das tabelas ocultas", () => {
  const sql = readFileSync("supabase/migrations/20260801140643_persistent_club_operations_v1.sql", "utf8");
  assert.match(sql, /revoke select on public\.players,public\.player_attributes,public\.player_hidden_traits/i);
  assert.match(sql, /alter table public\.player_reports enable row level security/i);
  assert.match(sql, /interval '2 hours'/i);
  assert.match(sql, /cancel_deadline = effective_at - interval '15 minutes'/i);
});
