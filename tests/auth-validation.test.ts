import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyLoginIdentifier,
  formatBrazilianWhatsapp,
  getUsernameValidationError,
  normalizeBrazilianWhatsapp,
  normalizeUsername,
  safeNextPath,
  validateSignupInput,
} from "../lib/auth/validation.ts";

const validSignup = {
  username: "rafael.campos",
  firstName: "Rafael",
  lastName: "Campos Silva",
  email: "Rafael@Example.com",
  whatsapp: "(31) 99999-9999",
  password: "Senha#123",
  confirmPassword: "Senha#123",
};

test("normaliza cadastro valido", () => {
  const result = validateSignupInput(validSignup);
  assert.deepEqual(result.errors, {});
  assert.equal(result.value?.usernameNormalized, "rafael.campos");
  assert.equal(result.value?.email, "rafael@example.com");
  assert.equal(result.value?.whatsapp, "+5531999999999");
});

test("rejeita campos obrigatorios, usuario reservado e senha fraca", () => {
  const result = validateSignupInput({
    username: "Admin",
    firstName: "!",
    lastName: "*",
    email: "invalido",
    whatsapp: "(20) 1234-5678",
    password: "12345678",
    confirmPassword: "outra",
  });
  assert.ok(result.errors.username);
  assert.ok(result.errors.firstName);
  assert.ok(result.errors.lastName);
  assert.ok(result.errors.email);
  assert.ok(result.errors.whatsapp);
  assert.ok(result.errors.password);
  assert.ok(result.errors.confirmPassword);
});

test("usuario e login nao diferenciam maiusculas", () => {
  assert.equal(normalizeUsername(" Rafael_31 "), "rafael_31");
  assert.deepEqual(classifyLoginIdentifier("RAFAEL_31"), {
    type: "username",
    normalized: "rafael_31",
  });
});

test("valida formato, tamanho e nomes reservados de usuario", () => {
  assert.equal(getUsernameValidationError("jogador.31"), null);
  assert.equal(getUsernameValidationError(" JOGADOR_31 "), null);
  assert.match(getUsernameValidationError("ab") || "", /3 a 24/);
  assert.match(getUsernameValidationError("a".repeat(25)) || "", /3 a 24/);
  assert.match(getUsernameValidationError("nome com espaco") || "", /letras/);
  assert.match(getUsernameValidationError("nome-com-hifen") || "", /letras/);
  assert.match(getUsernameValidationError("Suporte") || "", /reservado/);
});

test("classifica e normaliza e-mail e WhatsApp com mascara", () => {
  assert.deepEqual(classifyLoginIdentifier(" PESSOA@EXAMPLE.COM "), {
    type: "email",
    normalized: "pessoa@example.com",
  });
  assert.deepEqual(classifyLoginIdentifier("(31) 99999-9999"), {
    type: "whatsapp",
    normalized: "+5531999999999",
  });
  assert.equal(normalizeBrazilianWhatsapp("+55 31 99999-9999"), "+5531999999999");
  assert.equal(formatBrazilianWhatsapp("31999999999"), "(31) 99999-9999");
});

test("bloqueia redirecionamento externo", () => {
  assert.equal(safeNextPath("/imprensa"), "/imprensa");
  assert.equal(safeNextPath("https://example.com"), "/central");
  assert.equal(safeNextPath("//example.com"), "/central");
});
