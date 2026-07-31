import "server-only";

import { createHash, randomBytes } from "node:crypto";

export function createVerificationToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashVerificationToken(token) };
}

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
