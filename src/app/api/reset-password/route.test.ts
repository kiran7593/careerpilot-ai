import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFindUnique,
  mockDeleteMany,
  mockUserUpdate,
  mockTransaction,
  mockHashResetToken,
  mockBcryptHash,
} = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockTransaction: vi.fn(),
  mockHashResetToken: vi.fn(),
  mockBcryptHash: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mockTransaction,
  },
}));

vi.mock("@/lib/passwordReset", () => ({
  hashResetToken: mockHashResetToken,
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: mockBcryptHash,
  },
}));

import { POST } from "./route";

function createRequest(body: string): Request {
  return new Request("http://localhost/api/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
}

describe("Reset Password API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockHashResetToken.mockReturnValue("hashed-reset-token");
    mockBcryptHash.mockResolvedValue("new-password-hash");

    mockFindUnique.mockResolvedValue({
      userId: "user-123",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    mockDeleteMany.mockResolvedValue({ count: 1 });
    mockUserUpdate.mockResolvedValue({});

    mockTransaction.mockImplementation(async (callback) =>
      callback({
        passwordResetToken: {
          findUnique: mockFindUnique,
          deleteMany: mockDeleteMany,
        },
        user: {
          update: mockUserUpdate,
        },
      })
    );
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(createRequest("{"));

    expect(response.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects invalid request body structures", async () => {
    const response = await POST(createRequest("null"));

    expect(response.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects unexpected fields", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          token: "valid-token",
          password: "new-password",
          role: "admin",
        })
      )
    );

    expect(response.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects missing token or password", async () => {
    const response = await POST(
      createRequest(JSON.stringify({ token: "valid-token" }))
    );

    expect(response.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects passwords shorter than eight characters", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          token: "valid-token",
          password: "short",
        })
      )
    );

    expect(response.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects passwords longer than 72 UTF-8 bytes", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          token: "valid-token",
          password: "a".repeat(73),
        })
      )
    );

    expect(response.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("resets the password using a valid token", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          token: "valid-token",
          password: "new-password-123",
        })
      )
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Your password has been reset successfully.",
    });

    expect(mockHashResetToken).toHaveBeenCalledWith("valid-token");
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { tokenHash: "hashed-reset-token" },
      select: {
        userId: true,
        expiresAt: true,
      },
    });

    expect(mockDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tokenHash: "hashed-reset-token",
          userId: "user-123",
        }),
      })
    );

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: "user-123" },
      data: { passwordHash: "new-password-hash" },
    });
  });

  it("rejects an unknown reset token", async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await POST(
      createRequest(
        JSON.stringify({
          token: "unknown-token",
          password: "new-password-123",
        })
      )
    );

    expect(response.status).toBe(400);
    expect(mockDeleteMany).not.toHaveBeenCalled();
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("rejects an expired reset token", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user-123",
      expiresAt: new Date(Date.now() - 60 * 1000),
    });

    const response = await POST(
      createRequest(
        JSON.stringify({
          token: "expired-token",
          password: "new-password-123",
        })
      )
    );

    expect(response.status).toBe(400);
    expect(mockDeleteMany).not.toHaveBeenCalled();
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("does not update the password if the token was already consumed", async () => {
    mockDeleteMany.mockResolvedValue({ count: 0 });

    const response = await POST(
      createRequest(
        JSON.stringify({
          token: "already-used-token",
          password: "new-password-123",
        })
      )
    );

    expect(response.status).toBe(400);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("returns an error when the database operation fails", async () => {
    mockTransaction.mockRejectedValue(
      new Error("Database unavailable")
    );

    const response = await POST(
      createRequest(
        JSON.stringify({
          token: "valid-token",
          password: "new-password-123",
        })
      )
    );

    expect(response.status).toBe(500);
  });
});
