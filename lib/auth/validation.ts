export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrador",
  "central",
  "cadastro",
  "escritorio",
  "imprensa",
  "login",
  "moderador",
  "moderator",
  "oficial",
  "root",
  "staff",
  "suporte",
  "supabase",
  "sistema",
  "vercel",
]);

const VALID_BRAZILIAN_DDDS = new Set([
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "24", "27", "28",
  "31", "32", "33", "34", "35", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "51", "53", "54", "55",
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
]);

export type SignupInput = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  password: string;
  confirmPassword: string;
};

export type NormalizedSignup = {
  username: string;
  usernameNormalized: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  password: string;
};

export type SignupField = keyof SignupInput | "form";
export type SignupErrors = Partial<Record<SignupField, string>>;

function compactName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeBrazilianWhatsapp(value: string): string | null {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  if (digits.length !== 10 && digits.length !== 11) return null;

  const ddd = digits.slice(0, 2);
  const subscriber = digits.slice(2);
  if (!VALID_BRAZILIAN_DDDS.has(ddd)) return null;
  if (subscriber.length === 9 && !subscriber.startsWith("9")) return null;
  if (subscriber.length === 8 && !/^[2-9]/.test(subscriber)) return null;

  return `+55${digits}`;
}

export function formatBrazilianWhatsapp(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  digits = digits.slice(0, 11);

  if (digits.length <= 2) return digits ? `(${digits}` : "";
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

export function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export function validateSignupInput(input: SignupInput): {
  value?: NormalizedSignup;
  errors: SignupErrors;
} {
  const username = input.username.trim();
  const usernameNormalized = normalizeUsername(username);
  const firstName = compactName(input.firstName);
  const lastName = compactName(input.lastName);
  const email = normalizeEmail(input.email);
  const whatsapp = normalizeBrazilianWhatsapp(input.whatsapp);
  const errors: SignupErrors = {};

  if (!/^[A-Za-z0-9._]{3,24}$/.test(username) || /[\x00-\x1f\x7f]/.test(username)) {
    errors.username = "Use de 3 a 24 caracteres: letras, numeros, ponto ou sublinhado.";
  } else if (RESERVED_USERNAMES.has(usernameNormalized)) {
    errors.username = "Este nome de usuario e reservado.";
  }

  if (firstName.length < 2 || firstName.length > 60 || !/\p{L}/u.test(firstName)) {
    errors.firstName = "Informe um nome valido com 2 a 60 caracteres.";
  }

  if (lastName.length < 2 || lastName.length > 100 || !/\p{L}/u.test(lastName)) {
    errors.lastName = "Informe um sobrenome valido com 2 a 100 caracteres.";
  }

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Informe um e-mail valido.";
  }

  if (!whatsapp) {
    errors.whatsapp = "Informe um WhatsApp brasileiro com DDD valido.";
  }

  if (!isStrongPassword(input.password)) {
    errors.password = "Use 8 ou mais caracteres, com maiuscula, minuscula, numero e simbolo.";
  }

  if (!input.confirmPassword || input.password !== input.confirmPassword) {
    errors.confirmPassword = "As senhas precisam ser iguais.";
  }

  if (Object.keys(errors).length > 0 || !whatsapp) return { errors };

  return {
    errors,
    value: {
      username,
      usernameNormalized,
      firstName,
      lastName,
      email,
      whatsapp,
      password: input.password,
    },
  };
}

export type LoginIdentifier =
  | { type: "email"; normalized: string }
  | { type: "whatsapp"; normalized: string }
  | { type: "username"; normalized: string };

export function classifyLoginIdentifier(value: string): LoginIdentifier {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return { type: "email", normalized: normalizeEmail(trimmed) };

  const whatsapp = normalizeBrazilianWhatsapp(trimmed);
  if (whatsapp) return { type: "whatsapp", normalized: whatsapp };

  return { type: "username", normalized: normalizeUsername(trimmed) };
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "e-mail cadastrado";
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(3, Math.min(8, local.length - 1)))}@${domain}`;
}

export function maskWhatsapp(whatsapp: string | null | undefined) {
  if (!whatsapp) return "numero nao informado";
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 12) return "numero cadastrado";
  return `+55 (${digits.slice(2, 4)}) *****-${digits.slice(-4)}`;
}

export function safeNextPath(value: string | null | undefined, fallback = "/central") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
