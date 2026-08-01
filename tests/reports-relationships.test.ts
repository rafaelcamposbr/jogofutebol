import assert from "node:assert/strict";
import test from "node:test";
import { buildConsensus, estimateHiddenCategory, reportAgeStatus, reportPrecision, reportUncertainty } from "../lib/game/reports/engine.ts";
import { applyRelationshipEvent, initialRelationship, personalityCompatibility, propagatedDelta } from "../lib/game/relationships/engine.ts";

const base = { authorId: "a", playerId: "p", version: 1, date: "2026-08-01T12:00:00Z", functionalAptitude: 20, familiarity: 10, observationQuality: 30, dataQuality: 30 };

test("relatorio melhora com aptidao e familiaridade sem atingir certeza total", () => {
  const low = reportPrecision(base);
  const high = reportPrecision({ ...base, functionalAptitude: 95, familiarity: 90, observationQuality: 90, dataQuality: 90 });
  assert.ok(high > low);
  assert.ok(low >= 10 && high <= 95);
  assert.ok(reportUncertainty(low) > reportUncertainty(high));
  assert.deepEqual(estimateHiddenCategory(70, "technical", base), estimateHiddenCategory(70, "technical", base));
});

test("envelhecimento, divergencia e consenso ponderado sao calculados", () => {
  assert.equal(reportAgeStatus("2026-07-25T12:00:00Z", 70, new Date("2026-08-01T12:00:00Z")), "current");
  assert.equal(reportAgeStatus("2026-04-01T12:00:00Z", 70, new Date("2026-08-01T12:00:00Z")), "outdated");
  assert.equal(reportAgeStatus("2026-07-31T12:00:00Z", 20, new Date("2026-08-01T12:00:00Z")), "unreliable");
  const consensus = buildConsensus([{ central: 52, precision: 35 }, { central: 70, precision: 90 }]);
  assert.ok(consensus);
  assert.ok(consensus.central > 60);
  assert.equal(consensus.divergence, 18);
});

test("compatibilidade, conflitos e propagacao social permanecem limitados", () => {
  const compatible = personalityCompatibility({ ambition: 4, professionalism: 5 }, { ambition: 4, professionalism: 5 });
  const conflicting = personalityCompatibility({ contention: 5, autonomy: 5 }, { leadership: 5, discipline: 5 });
  assert.ok(compatible > conflicting);
  const initial = initialRelationship(compatible);
  const regular = applyRelationshipEvent(initial, { trust: -20, tension: 20 });
  const severe = applyRelationshipEvent(initial, { trust: -20, tension: 20 }, true);
  assert.equal(initial.trust - regular.trust, 5);
  assert.ok(initial.trust - severe.trust > 5);
  assert.ok(Math.abs(propagatedDelta(-5, 90)) <= 2);
});
