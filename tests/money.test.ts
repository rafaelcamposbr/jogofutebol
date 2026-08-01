import assert from "node:assert/strict";
import test from "node:test";
import { centsToMoney, formatBRL, formatBRLCents, moneyToCents } from "../lib/money.ts";

test("formatacao monetaria brasileira preserva centavos e negativos", () => {
  assert.equal(formatBRL(1000.06), "R$ 1.000,06");
  assert.equal(formatBRL(0.5), "R$ 0,50");
  assert.equal(formatBRL(-1000), "-R$ 1.000,00");
  assert.equal(formatBRLCents(145688), "R$ 1.456,88");
});

test("parser monetario aceita formato brasileiro e rejeita ambiguidades", () => {
  assert.equal(moneyToCents("R$ 12.598,80"), 1_259_880);
  assert.equal(moneyToCents("0,50"), 50);
  assert.equal(centsToMoney(145688), 1456.88);
  assert.throws(() => moneyToCents("1,2,3"), /invalid_money/);
  assert.throws(() => moneyToCents("NaN"), /invalid_money/);
});
