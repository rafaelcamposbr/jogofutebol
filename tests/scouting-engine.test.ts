import assert from "node:assert/strict";
import test from "node:test";
import { candidateCount, generateTryoutCandidates, preparationQuality, selectionQuality, TRYOUT_COST_CENTS } from "../lib/game/scouting/engine.ts";

const preferences = { ageMin: 16, ageMax: 24, positions: [] as never[], maxPerPosition: 8, focus: "broad" as const };

test("peneira usa custo fixo e formulas de preparacao e selecao", () => {
  assert.equal(TRYOUT_COST_CENTS, 145688);
  assert.equal(Math.round(preparationQuality(1)), 18);
  assert.equal(Number(preparationQuality(30).toFixed(2)), 98.59);
  assert.ok(selectionQuality(90, 30) > selectionQuality(25, 1));
});

test("quantidade de candidatos respeita dias, qualidade, limites e determinismo", () => {
  for (const days of [1, 7, 30]) {
    const low = candidateCount(days, 15, `seed-${days}`);
    const high = candidateCount(days, 90, `seed-${days}`);
    assert.ok(low >= 4 && low <= 50);
    assert.ok(high >= 4 && high <= 50);
    assert.ok(high >= low);
    assert.equal(candidateCount(days, 90, `seed-${days}`), high);
  }
});

test("geracao e persistivel por ids deterministas sem expor atributos no relatorio seguro", () => {
  const first = generateTryoutCandidates({ tryoutId: "tryout-qa", days: 7, scoutQuality: 72, preferences, today: "2026-08-01T12:00:00Z" });
  const second = generateTryoutCandidates({ tryoutId: "tryout-qa", days: 7, scoutQuality: 72, preferences, today: "2026-08-01T12:00:00Z" });
  assert.deepEqual(first, second);
  assert.ok(first.length >= 4 && first.length <= 50);
  const serialized = JSON.stringify(first.map((item) => item.candidate));
  ["finishing", "short_passing", "pace", "strength", "potential_ceiling", "natural_talent", "injury_proneness", "current_overall"].forEach((key) => assert.equal(serialized.includes(key), false));
});
