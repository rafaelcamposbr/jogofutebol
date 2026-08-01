import assert from "node:assert/strict";
import test from "node:test";
import { authenticatedHomeDestination, isMissingSessionError } from "../lib/auth/navigation.ts";

test("home autenticada prioriza criacao de clube", () => {
  assert.equal(authenticatedHomeDestination({ hasClub: false, whatsappVerified: false }), "/criar-clube");
  assert.equal(authenticatedHomeDestination({ hasClub: false, whatsappVerified: true }), "/criar-clube");
});

test("home autenticada abre o escritorio durante a beta", () => {
  assert.equal(authenticatedHomeDestination({ hasClub: true, whatsappVerified: false }), "/escritorio");
  assert.equal(authenticatedHomeDestination({ hasClub: true, whatsappVerified: true }), "/escritorio");
});

test("distingue sessao ausente de falha tecnica", () => {
  assert.equal(isMissingSessionError({ name: "AuthSessionMissingError" }), true);
  assert.equal(isMissingSessionError({ code: "session_not_found" }), true);
  assert.equal(isMissingSessionError({ code: "service_unavailable" }), false);
});
