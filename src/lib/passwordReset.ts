import { createHash, randomBytes } from "crypto";

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_EXPIRY_MINUTES = 15;

export function generateResetToken() {
  const token = randomBytes(RESET_TOKEN_BYTES).toString("hex");

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
  );

  return {
    token,
    tokenHash,
    expiresAt,
  };
}

export function hashResetToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}
