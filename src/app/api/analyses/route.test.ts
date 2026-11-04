
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    mockRequireAuth,
    mockFindMany,
    mockFindUnique,
    mockCreate,
} = vi.hoisted(() => ({
    mockRequireAuth: vi.fn(),
    mockFindMany: vi.fn(),
    mockFindUnique: vi.fn(),
    mockCreate: vi.fn(),
}));

vi.mock("@/lib/requireAuth", () => ({
    requireAuth: mockRequireAuth,
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        savedAnalysis: {
            findMany: mockFindMany,
            findUnique: mockFindUnique,
            create: mockCreate,
        },
    },
}));

import { GET, POST } from "./route";

const testUser = {
    id: "user-123",
    email: "test@example.com",
};

function createRequest(body: string): Request {
    return new Request("http://localhost/api/analyses", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body,
    });
}

const validAnalysis = {
    jobTitle: "Frontend Developer",
    jobDescription: "Looking for React and TypeScript experience.",
    userSkills: "JavaScript, React",
    matchingSkills: [
        { name: "React", category: "Frameworks" },
    ],
    missingSkills: [
        { name: "TypeScript", category: "Languages" },
    ],
    matchPercentage: 50,
};

describe("Analyses API", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockRequireAuth.mockResolvedValue(testUser);
        mockFindMany.mockResolvedValue([]);
        mockFindUnique.mockResolvedValue(null);
        mockCreate.mockResolvedValue({
            id: "analysis-123",
            userId: testUser.id,
            ...validAnalysis,
        });
    });

    describe("GET /api/analyses", () => {
        it("rejects unauthenticated requests", async () => {
            mockRequireAuth.mockResolvedValue(null);

            const response = await GET();

            expect(response.status).toBe(401);
            expect(mockFindMany).not.toHaveBeenCalled();
        });

        it("retrieves only the signed-in user's analyses", async () => {
            const response = await GET();

            expect(response.status).toBe(200);
            expect(mockFindMany).toHaveBeenCalledWith({
                where: { userId: testUser.id },
                orderBy: { createdAt: "desc" },
            });
        });
    });

    describe("POST /api/analyses", () => {
        it("rejects unauthenticated requests", async () => {
            mockRequireAuth.mockResolvedValue(null);

            const response = await POST(createRequest(JSON.stringify(validAnalysis)));

            expect(response.status).toBe(401);
            expect(mockCreate).not.toHaveBeenCalled();
        });

        it("rejects malformed JSON", async () => {
            const response = await POST(createRequest("{"));

            expect(response.status).toBe(400);
            expect(mockCreate).not.toHaveBeenCalled();
        });

        it("rejects malformed skill objects", async () => {
            const response = await POST(
                createRequest(
                    JSON.stringify({
                        ...validAnalysis,
                        matchingSkills: [
                            { name: "React", category: "Unknown" },
                        ],
                    }),
                ),
            );

            expect(response.status).toBe(400);
            expect(mockCreate).not.toHaveBeenCalled();
        });

        it("rejects unexpected fields such as userId", async () => {
            const response = await POST(
                createRequest(
                    JSON.stringify({
                        ...validAnalysis,
                        userId: "another-user",
                    }),
                ),
            );

            expect(response.status).toBe(400);
            expect(mockCreate).not.toHaveBeenCalled();
        });

        it("creates an analysis under the authenticated user's ID", async () => {
            const response = await POST(
                createRequest(JSON.stringify(validAnalysis)),
            );

            expect(response.status).toBe(201);
            expect(mockCreate).toHaveBeenCalledWith({
                data: {
                    userId: testUser.id,
                    ...validAnalysis,
                },
            });
        });
    });
});
