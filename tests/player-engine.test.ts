import assert from "node:assert/strict";
import test from "node:test";
import { calculateDailyDevelopment, calculateMoraleEvent, calculatePlayerReaction, calculateRoleFit, generateInitialSquad } from "../lib/game/players/engine.ts";

test("elenco inicial gera 25 identidades estaveis com distribuicao valida", () => {
  const first = generateInitialSquad("11111111-1111-4111-8111-111111111111");
  const second = generateInitialSquad("11111111-1111-4111-8111-111111111111");
  assert.equal(first.length, 25);
  assert.deepEqual(first, second);
  assert.equal(new Set(first.map((item) => item.player.id)).size, 25);
  assert.equal(first.filter((item) => item.player.main_position === "GK").length, 3);
  assert.ok(first.every((item) => item.player.current_overall >= 0 && item.player.current_overall <= 100));
});

test("talento natural acelera desenvolvimento sem permitir salto diario", () => {
  const low = calculateDailyDevelopment({ current: 55, naturalTalent: 35, age: 19, professionalism: 70, morale: 65, physicalAvailability: 92 });
  const high = calculateDailyDevelopment({ current: 55, naturalTalent: 90, age: 19, professionalism: 70, morale: 65, physicalAvailability: 92 });
  assert.ok(high > low);
  assert.ok(high <= 0.035);
});

test("aptidao por posicao e funcao afeta encaixe", () => {
  assert.ok(calculateRoleFit(90, 85, 70) > calculateRoleFit(52, 40, 70));
});

test("personalidades reagem de forma diferente ao mesmo evento", () => {
  const resilient = calculateMoraleEvent(-5, { resilience: 5, loyalty: 4 });
  const contentious = calculateMoraleEvent(-5, { contention: 5, resilience: 0 });
  assert.ok(resilient > contentious);
  const loyal = calculatePlayerReaction({ text: "Quero conversar sobre sua transferencia.", personality: { loyalty: 5, contention: 0 }, morale: 60, satisfaction: 55 });
  const rebellious = calculatePlayerReaction({ text: "Quero conversar sobre sua transferencia.", personality: { loyalty: 0, contention: 5 }, morale: 60, satisfaction: 55 });
  assert.ok(loyal.transferIntentDelta < rebellious.transferIntentDelta);
});
