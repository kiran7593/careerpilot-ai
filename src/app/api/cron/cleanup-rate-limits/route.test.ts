import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockCleanupExpiredRateLimits } = vi.hoisted(() => ({
  mockCleanupExpiredRateLimits: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  cleanupExpiredRateLimits: mockCleanupExpiredRateLimits,
}));

import { GET } from "./route";

const originalCronSecret = process.env.CRON_SECRET;

function createRequest(authorization?: string) {
  return new NextRequest(
    "http://localhost:3000/api/cron/cleanup-rate-limits",
    {
      headers: authorization
        ? { authorization }
        : {},
    }
  );
}

describe("Rate-limit cleanup cron endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
  });

  afterEach(() => {
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }

    vi.restoreAllMocks();
  });

  it("rejects requests without an authorization header", async () => {
    const response = await GET(createRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      message: "Unauthorized.",
    });

    expect(mockCleanupExpiredRateLimits).not.toHaveBeenCalled();
  });

  it("rejects requests with an incorrect secret", async () => {
    const response = await GET(
      createRequest("Bearer wrong-secret")
    );

    expect(response.status).toBe(401);
    expect(mockCleanupExpiredRateLimits).not.toHaveBeenCalled();
  });

  it("cleans up expired records with a valid secret", async () => {
    mockCleanupExpiredRateLimits.mockResolvedValue(3);

    const response = await GET(
      createRequest("Bearer test-cron-secret")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Expired rate-limit records cleaned up.",
      deletedCount: 3,
    });

    expect(mockCleanupExpiredRateLimits).toHaveBeenCalledTimes(1);
  });

  it("returns a server error when cleanup fails", async () => {
    mockCleanupExpiredRateLimits.mockRejectedValue(
      new Error("Database cleanup failed.")
    );

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const response = await GET(
      createRequest("Bearer test-cron-secret")
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "Unable to clean up expired rate-limit records.",
    });

    expect(consoleError).toHaveBeenCalled();
  });
});
