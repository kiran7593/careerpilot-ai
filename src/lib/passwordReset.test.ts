import { describe, expect, it } from "vitest";
import {
  generateResetToken,
  hashResetToken,
} from "./passwordReset";

describe("Password reset utilities", () => {
  it("generates a secure random token", () => {
    const result = generateResetToken();

    expect(result.token).toHaveLength(64);
    expect(result.token).toMatch(/^[a-f0-9]+$/);
    expect(result.tokenHash).toHaveLength(64);
    expect(result.tokenHash).not.toBe(result.token);
  });

  it("generates a different token each time", () => {
    const first = generateResetToken();
    const second = generateResetToken();

    expect(first.token).not.toBe(second.token);
    expect(first.tokenHash).not.toBe(second.tokenHash);
  });

  it("sets the token expiration to 15 minutes", () => {
    const before = Date.now();
    const result = generateResetToken();
    const after = Date.now();

    const expectedMinimum = before + 15 * 60 * 1000;
    const expectedMaximum = after + 15 * 60 * 1000;

    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(
      expectedMinimum
    );
    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(
      expectedMaximum
    );
  });

  it("hashes the same token consistently", () => {
    const { token, tokenHash } = generateResetToken();

    expect(hashResetToken(token)).toBe(tokenHash);
  });

  it("produces different hashes for different tokens", () => {
    expect(hashResetToken("token-one")).not.toBe(
      hashResetToken("token-two")
    );
  });
});