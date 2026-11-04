
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockHash,
  mockFindUnique,
  mockCreate,
} = vi.hoisted(() => ({
  mockHash: vi.fn(),
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: mockHash,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  },
}));

import { POST } from "./route";

function createRequest(body: string): Request {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
}

const validUser = {
  id: "user-123",
  name: "Kiran",
  email: "kiran@example.com",
};

describe("Registration API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockHash.mockResolvedValue("secure-hashed-password");

    mockFindUnique.mockResolvedValue(null);

    mockCreate.mockResolvedValue(validUser);
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(createRequest("{"));

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid request body structures", async () => {
    const response = await POST(createRequest("null"));

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects unexpected fields", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Kiran",
          email: "kiran@example.com",
          password: "password123",
          role: "admin",
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("requires name, email, and password", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "",
          email: "kiran@example.com",
          password: "password123",
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects names longer than 100 characters", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "K".repeat(101),
          email: "kiran@example.com",
          password: "password123",
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid email addresses", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Kiran",
          email: "invalid-email",
          password: "password123",
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects passwords shorter than 8 characters", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Kiran",
          email: "kiran@example.com",
          password: "short",
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects passwords longer than 72 UTF-8 bytes", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Kiran",
          email: "kiran@example.com",
          password: "a".repeat(73),
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects duplicate email addresses", async () => {
    mockFindUnique.mockResolvedValue(validUser);

    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Kiran",
          email: "kiran@example.com",
          password: "password123",
        }),
      ),
    );

    expect(response.status).toBe(409);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("normalizes email and hashes the password before creating an account", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Kiran",
          email: " KIRAN@EXAMPLE.COM ",
          password: "password123",
        }),
      ),
    );

    expect(response.status).toBe(201);

    expect(mockHash).toHaveBeenCalledWith("password123", 12);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        name: "Kiran",
        email: "kiran@example.com",
        passwordHash: "secure-hashed-password",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const result = await response.json();

    expect(result.user).toEqual(validUser);
    expect(result.user.passwordHash).toBeUndefined();
  });
});
