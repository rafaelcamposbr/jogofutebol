import assert from "node:assert/strict";
import test from "node:test";
import { FORMATIONS, FORMATION_SLOTS, suggestLineup, validateLineup } from "../lib/game/tactics/engine.ts";
import { INITIAL_SQUAD_POSITIONS } from "../lib/game/players/config.ts";

const players = INITIAL_SQUAD_POSITIONS.map((position, index) => ({ id: `p-${index}`, main_position: position, current_overall: 50 + (index % 20), tactical_familiarity: 45 }));

test("oito formacoes possuem onze vagas e um goleiro", () => {
  assert.equal(FORMATIONS.length, 8);
  FORMATIONS.forEach((formation) => {
    assert.equal(FORMATION_SLOTS[formation].length, 11);
    assert.equal(FORMATION_SLOTS[formation].filter((slot) => slot.position === "GK").length, 1);
  });
});

test("sugestao produz onze titulares unicos, goleiro e banco", () => {
  const assignments = suggestLineup("4-3-3", players);
  assert.equal(assignments.filter((item) => item.isStarter).length, 11);
  assert.equal(assignments.filter((item) => !item.isStarter).length, 7);
  assert.equal(new Set(assignments.map((item) => item.playerId)).size, 18);
  assert.equal(validateLineup("4-3-3", assignments).valid, true);
});

test("escalacao duplicada e sem goleiro e rejeitada", () => {
  const assignments = suggestLineup("4-4-2", players);
  assignments[1].playerId = assignments[0].playerId;
  assignments[0].position = "CB";
  const result = validateLineup("4-4-2", assignments);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 2);
});
