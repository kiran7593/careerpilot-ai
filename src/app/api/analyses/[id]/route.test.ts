import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    mockRequireAuth,
    mockUpdateMany,
    mockFindFirst,
    mockDeleteMany,
} = vi.hoisted(() => ({
    mockRequireAuth: vi.fn(),
    mockUpdateMany: vi.fn(),
    mockFindFirst: vi.fn(),
    mockDeleteMany: vi.fn(),
}));

vi.mock("@/lib/requireAuth", () => ({
    requireAuth: mockRequireAuth,
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        savedAnalysis: {
            updateMany: mockUpdateMany,
            findFirst: mockFindFirst,
            deleteMany: mockDeleteMany,
        },
    },
}));

import { DELETE, PUT } from "./route";

const testUser = {
    id: "user-123",
    email: "test@example.com",
};

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

function createRequest(body: string): Request {
    return new Request("http://localhost/api/analyses/analysis-123", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body,
    });
}

const routeContext = {
    params: Promise.resolve({ id: "analysis-123" }),
};

describe("Analysis by ID API", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockRequireAuth.mockResolvedValue(testUser);
        mockUpdateMany.mockResolvedValue({ count: 1 });
        mockFindFirst.mockResolvedValue({
            id: "analysis-123",
            userId: testUser.id,
            ...validAnalysis,
        });
        mockDeleteMany.mockResolvedValue({ count: 1 });
    });

    describe("PUT /api/analyses/[id]", () => {
        it("rejects unauthenticated requests", async () => {
            mockRequireAuth.mockResolvedValue(null);

            const response = await PUT(
                createRequest(JSON.stringify(validAnalysis)),
                routeContext,
            );

            expect(response.status).toBe(401);
            expect(mockUpdateMany).not.toHaveBeenCalled();
        });

        it("rejects malformed JSON", async () => {
            const response = await PUT(
                createRequest("{"),
                routeContext,
            );

            expect(response.status).toBe(400);
            expect(mockUpdateMany).not.toHaveBeenCalled();
        });

        it("rejects unexpected fields such as userId", async () => {
            const response = await PUT(
                createRequest(
                    JSON.stringify({
                        ...validAnalysis,
                        userId: "another-user",
                    }),
                ),
                routeContext,
            );

            expect(response.status).toBe(400);
            expect(mockUpdateMany).not.toHaveBeenCalled();
        });

        it("rejects invalid skill categories", async () => {
            const response = await PUT(
                createRequest(
                    JSON.stringify({
                        ...validAnalysis,
                        matchingSkills: [
                            { name: "React", category: "Unknown" },
                        ],
                    }),
                ),
                routeContext,
            );

            expect(response.status).toBe(400);
            expect(mockUpdateMany).not.toHaveBeenCalled();
        });

        it("updates only the signed-in user's analysis", async () => {
            const response = await PUT(
                createRequest(JSON.stringify(validAnalysis)),
                routeContext,
            );

            expect(response.status).toBe(200);
            expect(mockUpdateMany).toHaveBeenCalledWith({
                where: {
                    id: "analysis-123",
                    userId: testUser.id,
                },
                data: validAnalysis,
            });
        });

        it("returns 404 when the analysis is not owned by the user", async () => {
            mockUpdateMany.mockResolvedValue({ count: 0 });

            const response = await PUT(
                createRequest(JSON.stringify(validAnalysis)),
                routeContext,
            );

            expect(response.status).toBe(404);
            expect(mockFindFirst).not.toHaveBeenCalled();
        });
    });

    describe("DELETE /api/analyses/[id]", () => {
        it("rejects unauthenticated requests", async () => {
            mockRequireAuth.mockResolvedValue(null);

            const response = await DELETE(
                new Request("http://localhost/api/analyses/analysis-123"),
                routeContext,
            );

            expect(response.status).toBe(401);
            expect(mockDeleteMany).not.toHaveBeenCalled();
        });

        it("deletes only the signed-in user's analysis", async () => {
            const response = await DELETE(
                new Request("http://localhost/api/analyses/analysis-123"),
                routeContext,
            );

            expect(response.status).toBe(200);
            expect(mockDeleteMany).toHaveBeenCalledWith({
                where: {
                    id: "analysis-123",
                    userId: testUser.id,
                },
            });
        });

        it("returns 404 when the analysis is not owned by the user", async () => {
            mockDeleteMany.mockResolvedValue({ count: 0 });

            const response = await DELETE(
                new Request("http://localhost/api/analyses/analysis-123"),
                routeContext,
            );

            expect(response.status).toBe(404);
        });
    });
});