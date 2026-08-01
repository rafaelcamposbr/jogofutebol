import assert from "node:assert/strict";
import test from "node:test";
import { STAFF_ROLES, getStaffRole, isRoleInGroup, rolesForGroup, suggestedStaffSalary } from "../lib/game/staff-catalog.ts";

test("funcoes sao filtradas por grupo e manipulacao incompatível e recusada", () => {
  const medical = rolesForGroup("medical");
  assert.ok(medical.length >= 9);
  assert.ok(medical.every((item) => item.groupId === "medical"));
  assert.equal(isRoleInGroup("doctor", "medical"), true);
  assert.equal(isRoleInGroup("doctor", "football"), false);
  assert.equal(isRoleInGroup("scout", "medical"), false);
});

test("olheiro possui hierarquia e faixa salarial configurada", () => {
  const scout = getStaffRole("scout");
  assert.ok(scout);
  assert.equal(scout.groupId, "football");
  assert.equal(scout.relevance, 3);
  assert.equal(scout.salaryMin, 6000);
  assert.equal(scout.salaryMax, 42000);
  assert.equal(suggestedStaffSalary(scout, 0), 6000);
  assert.equal(suggestedStaffSalary(scout, 100), 42000);
  assert.equal(STAFF_ROLES.filter((item) => item.id === "scout").length, 1);
});
