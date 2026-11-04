
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    mockFindUnique,
    mockDeleteMany,
    mockCreate,
    mockTransaction,
    mockGenerateResetToken,
    mockSendPasswordResetEmail,
    mockCheckRateLimit,
} = vi.hoisted(() => ({
    mockFindUnique: vi.fn(),
    mockDeleteMany: vi.fn(),
    mockCreate: vi.fn(),
    mockTransaction: vi.fn(),
    mockGenerateResetToken: vi.fn(),
    mockSendPasswordResetEmail: vi.fn(),
    mockCheckRateLimit: vi.fn(),
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

vi.mock("@/lib/resend", () => ({
    sendPasswordResetEmail: mockSendPasswordResetEmail,
}));

vi.mock("@/lib/rateLimit", () => ({
    checkRateLimit: mockCheckRateLimit,
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
        vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
        vi.stubEnv("APP_URL", "https://careerpilot.example.com");

        mockCheckRateLimit.mockResolvedValue({
            allowed: true,
            remaining: 4,
            retryAfterSeconds: 900,
        });

        mockFindUnique.mockResolvedValue({ id: "user-123" });
        mockDeleteMany.mockResolvedValue({ count: 0 });
        mockCreate.mockResolvedValue({});
        mockTransaction.mockResolvedValue([]);
        mockGenerateResetToken.mockReturnValue({
            token: "secure-reset-token",
            tokenHash: "secure-token-hash",
            expiresAt: new Date("2026-12-01T12:15:00.000Z"),
        });
        mockSendPasswordResetEmail.mockResolvedValue({
            data: { id: "email-123" },
            error: null,
        });
    });

    it("blocks requests that exceed the rate limit", async () => {
        mockCheckRateLimit.mockResolvedValue({
            allowed: false,
            remaining: 0,
            retryAfterSeconds: 300,
        });

        const response = await POST(
            createRequest(JSON.stringify({ email: "kiran@example.com" }))
        );

        expect(response.status).toBe(429);
        expect(response.headers.get("Retry-After")).toBe("300");
        expect(mockFindUnique).not.toHaveBeenCalled();
        expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("does not expose email provider errors to the user", async () => {
        mockSendPasswordResetEmail.mockResolvedValue({
            data: null,
            error: { message: "Email provider unavailable" },
        });

        const response = await POST(
            createRequest(JSON.stringify({ email: "kiran@example.com" }))
        );

        expect(response.status).toBe(500);

        const responseBody = await response.json();

        expect(JSON.stringify(responseBody)).not.toContain(
            "Email provider unavailable"
        );
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
        expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
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

        expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
            "kiran@example.com",
            "https://careerpilot.example.com/reset-password?token=secure-reset-token"
        );
    });

    it("does not expose the reset token outside development", async () => {
        const originalNodeEnv = process.env.NODE_ENV;

        vi.stubEnv("NODE_ENV", "production");
        vi.stubEnv("APP_URL", "https://careerpilot.example.com");

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
        vi.stubEnv("APP_URL", "http://localhost:3000");

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
