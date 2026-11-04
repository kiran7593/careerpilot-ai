import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    mockFindUnique,
    mockDeleteMany,
    mockCreate,
    mockTransaction,
    mockGenerateResetToken,
} = vi.hoisted(() => ({
    mockFindUnique: vi.fn(),
    mockDeleteMany: vi.fn(),
    mockCreate: vi.fn(),
    mockTransaction: vi.fn(),
    mockGenerateResetToken: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: mockFindUnique,
        },
        passwordResetToken: {
            deleteMany: mockDeleteMany,
            create: mockCreate,
        },
        $transaction: mockTransaction,
    },
}));

vi.mock("@/lib/passwordReset", () => ({
    generateResetToken: mockGenerateResetToken,
}));

import { POST } from "./route";

function createRequest(body: string): Request {
    return new Request("http://localhost/api/forgot-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body,
    });
}

const successMessage =
    "If an account exists with that email, password reset instructions will be provided.";

describe("Forgot Password API", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockFindUnique.mockResolvedValue({ id: "user-123" });
        mockDeleteMany.mockResolvedValue({ count: 0 });
        mockCreate.mockResolvedValue({});
        mockTransaction.mockResolvedValue([]);
        mockGenerateResetToken.mockReturnValue({
            token: "secure-reset-token",
            tokenHash: "secure-token-hash",
            expiresAt: new Date("2026-12-01T12:15:00.000Z"),
        });
    });

    it("rejects malformed JSON", async () => {
        const response = await POST(createRequest("{"));

        expect(response.status).toBe(400);
        expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it("rejects invalid request body structures", async () => {
        const response = await POST(createRequest("null"));

        expect(response.status).toBe(400);
        expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it("rejects unexpected fields", async () => {
        const response = await POST(
            createRequest(
                JSON.stringify({
                    email: "kiran@example.com",
                    role: "admin",
                })
            )
        );

        expect(response.status).toBe(400);
        expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it("rejects invalid email addresses", async () => {
        const response = await POST(
            createRequest(JSON.stringify({ email: "invalid-email" }))
        );

        expect(response.status).toBe(400);
        expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it("rejects non-string email values", async () => {
        const response = await POST(
            createRequest(JSON.stringify({ email: 123 }))
        );

        expect(response.status).toBe(400);
        expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it("normalizes email addresses", async () => {
        const response = await POST(
            createRequest(
                JSON.stringify({ email: " KIRAN@EXAMPLE.COM " })
            )
        );

        expect(response.status).toBe(200);
        expect(mockFindUnique).toHaveBeenCalledWith({
            where: { email: "kiran@example.com" },
            select: { id: true },
        });
    });

    it("returns the same success message when the account does not exist", async () => {
        mockFindUnique.mockResolvedValue(null);

        const response = await POST(
            createRequest(JSON.stringify({ email: "unknown@example.com" }))
        );

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            message: successMessage,
        });
        expect(mockTransaction).not.toHaveBeenCalled();
    });

    it("creates a hashed reset token for an existing account", async () => {
        const response = await POST(
            createRequest(JSON.stringify({ email: "kiran@example.com" }))
        );

        expect(response.status).toBe(200);

        expect(mockDeleteMany).toHaveBeenCalledWith({
            where: { userId: "user-123" },
        });

        expect(mockCreate).toHaveBeenCalledWith({
            data: {
                tokenHash: "secure-token-hash",
                userId: "user-123",
                expiresAt: new Date("2026-12-01T12:15:00.000Z"),
            },
        });

        expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it("does not expose the reset token outside development", async () => {
        const originalNodeEnv = process.env.NODE_ENV;

        vi.stubEnv("NODE_ENV", "production");

        try {
            const response = await POST(
                createRequest(JSON.stringify({ email: "kiran@example.com" }))
            );

            const result = await response.json();

            expect(result.resetUrl).toBeUndefined();
            expect(JSON.stringify(result)).not.toContain("secure-reset-token");
        } finally {
            vi.stubEnv("NODE_ENV", originalNodeEnv);
        }
    });

    it("returns a reset URL in development", async () => {
        vi.stubEnv("NODE_ENV", "development");

        try {
            const response = await POST(
                createRequest(
                    JSON.stringify({ email: "kiran@example.com" })
                )
            );

            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.resetUrl).toBe(
                "http://localhost:3000/reset-password?token=secure-reset-token"
            );
        } finally {
            vi.unstubAllEnvs();
        }
    });

    it("returns an error when the database operation fails", async () => {
        mockFindUnique.mockRejectedValue(
            new Error("Database unavailable")
        );

        const response = await POST(
            createRequest(JSON.stringify({ email: "kiran@example.com" }))
        );

        expect(response.status).toBe(500);
        expect(mockTransaction).not.toHaveBeenCalled();
    });
});
