import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockQueryRaw, mockDeleteMany } = vi.hoisted(() => ({
    mockQueryRaw: vi.fn(),
    mockDeleteMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        $queryRaw: mockQueryRaw,
        rateLimitBucket: {
            deleteMany: mockDeleteMany,
        },
    },
}));

import {
    checkRateLimit,
    cleanupExpiredRateLimits,
} from "@/lib/rateLimit";

describe("Rate limiter", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("allows a request under the configured limit", async () => {
        mockQueryRaw.mockResolvedValue([
            {
                count: 1,
                expiresAt: new Date(Date.now() + 60_000),
            },
        ]);

        const result = await checkRateLimit("client-1", "forgot-password", {
            limit: 5,
            windowMs: 60_000,
        });

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
        expect(result.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("blocks a request after the configured limit", async () => {
        mockQueryRaw.mockResolvedValue([
            {
                count: 6,
                expiresAt: new Date(Date.now() + 60_000),
            },
        ]);

        const result = await checkRateLimit("client-1", "forgot-password", {
            limit: 5,
            windowMs: 60_000,
        });

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
    });

    it("throws when the database returns no bucket", async () => {
        mockQueryRaw.mockResolvedValue([]);

        await expect(
            checkRateLimit("client-1", "forgot-password", {
                limit: 5,
                windowMs: 60_000,
            })
        ).rejects.toThrow("Rate limit bucket could not be created.");
    });

    it("uses the database query for each request", async () => {
        mockQueryRaw.mockResolvedValue([
            {
                count: 1,
                expiresAt: new Date(Date.now() + 60_000),
            },
        ]);

        await checkRateLimit("client-1", "forgot-password", {
            limit: 5,
            windowMs: 60_000,
        });

        expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    });

    it("deletes expired rate-limit records and returns the deleted count", async () => {
        mockDeleteMany.mockResolvedValue({ count: 3 });

        const result = await cleanupExpiredRateLimits();

        expect(result).toBe(3);
        expect(mockDeleteMany).toHaveBeenCalledWith({
            where: {
                expiresAt: {
                    lte: expect.any(Date),
                },
            },
        });
    });

    it("returns zero when no expired records are found", async () => {
        mockDeleteMany.mockResolvedValue({ count: 0 });

        const result = await cleanupExpiredRateLimits();

        expect(result).toBe(0);
    });

    it("throws when the database cleanup fails", async () => {
        mockDeleteMany.mockRejectedValue(
            new Error("Database cleanup failed.")
        );

        await expect(cleanupExpiredRateLimits()).rejects.toThrow(
            "Database cleanup failed."
        );
    });
});
