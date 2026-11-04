
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCompare, mockFindUnique } = vi.hoisted(() => ({
    mockCompare: vi.fn(),
    mockFindUnique: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
    default: {
        compare: mockCompare,
    },
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: mockFindUnique,
        },
    },
}));

import { authOptions } from "./auth";

const credentialsProvider =
    authOptions.providers[0] as import("next-auth/providers/credentials").CredentialsConfig;

const authorize = credentialsProvider.options.authorize!;

const mockRequest = {
    body: {},
    query: {},
    headers: {},
    method: "POST",
};

const validUser = {
    id: "user-123",
    name: "Kiran",
    email: "kiran@example.com",
    passwordHash: "secure-hashed-password",
};

describe("Authentication", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockFindUnique.mockResolvedValue(validUser);
        mockCompare.mockResolvedValue(true);
    });

    it("returns the user when credentials are valid", async () => {
        const result = await authorize({
            email: "kiran@example.com",
            password: "password123",
        }, mockRequest);

        expect(result).toEqual({
            id: "user-123",
            email: "kiran@example.com",
            name: "Kiran",
        });

        expect(mockCompare).toHaveBeenCalledWith(
            "password123",
            "secure-hashed-password"
        );
    });

    it("normalizes the email address", async () => {
        await authorize({
            email: " KIRAN@EXAMPLE.COM ",
            password: "password123",
        }, mockRequest);

        expect(mockFindUnique).toHaveBeenCalledWith({
            where: { email: "kiran@example.com" },
        });
    });

    it("returns null when the user does not exist", async () => {
        mockFindUnique.mockResolvedValue(null);

        const result = await authorize({
            email: "unknown@example.com",
            password: "password123",
        }, mockRequest);

        expect(result).toBeNull();
        expect(mockCompare).not.toHaveBeenCalled();
    });

    it("returns null when the password is incorrect", async () => {
        mockCompare.mockResolvedValue(false);

        const result = await authorize({
            email: "kiran@example.com",
            password: "wrongpassword",
        }, mockRequest);

        expect(result).toBeNull();
    });

    it("returns null when credentials are missing", async () => {
        const result = await authorize(undefined, mockRequest);

        expect(result).toBeNull();
        expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it("returns null when email or password is empty", async () => {
        const emptyEmailResult = await authorize({
            email: " ",
            password: "password123",
        }, mockRequest);

        const emptyPasswordResult = await authorize({
            email: "kiran@example.com",
            password: "",
        }, mockRequest);

        expect(emptyEmailResult).toBeNull();
        expect(emptyPasswordResult).toBeNull();
        expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it("returns null when credentials are not strings", async () => {
        const result = await authorize({
            email: 123,
            password: true,
        } as unknown as Record<string, string>, mockRequest);

        expect(result).toBeNull();
        expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it("rejects credentials that exceed length limits", async () => {
        const longEmailResult = await authorize({
            email: `${"a".repeat(245)}@example.com`,
            password: "password123",
        }, mockRequest);

        const longPasswordResult = await authorize({
            email: "kiran@example.com",
            password: "a".repeat(73),
        }, mockRequest);

        expect(longEmailResult).toBeNull();
        expect(longPasswordResult).toBeNull();
        expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it("propagates database errors", async () => {
        const databaseError = new Error("Database unavailable");
        mockFindUnique.mockRejectedValue(databaseError);

        await expect(
            authorize({
                email: "kiran@example.com",
                password: "password123",
            }, mockRequest)
        ).rejects.toThrow("Database unavailable");

        expect(mockCompare).not.toHaveBeenCalled();
    });

    it("propagates password comparison errors", async () => {
        mockCompare.mockRejectedValue(
            new Error("Password comparison failed")
        );

        await expect(
            authorize({
                email: "kiran@example.com",
                password: "password123",
            }, mockRequest)
        ).rejects.toThrow("Password comparison failed");
    });
});
