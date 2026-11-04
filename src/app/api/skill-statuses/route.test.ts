import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    mockRequireAuth,
    mockFindMany,
    mockUpsert,
} = vi.hoisted(() => ({
    mockRequireAuth: vi.fn(),
    mockFindMany: vi.fn(),
    mockUpsert: vi.fn(),
}));

vi.mock("@/lib/requireAuth", () => ({
    requireAuth: mockRequireAuth,
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        skillStatus: {
            findMany: mockFindMany,
            upsert: mockUpsert,
        },
    },
}));

import { GET, PUT } from "./route";

const testUser = {
    id: "user-123",
    email: "test@example.com",
};

function createPutRequest(body: string): Request {
    return new Request("http://localhost/api/skill-statuses", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body,
    });
}

describe("Skill Statuses API", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockRequireAuth.mockResolvedValue(testUser);
        mockFindMany.mockResolvedValue([]);
        mockUpsert.mockResolvedValue({
            id: "status-123",
            userId: testUser.id,
            skillName: "React",
            status: "In Progress",
        });
    });

    describe("GET /api/skill-statuses", () => {
        it("rejects unauthenticated requests", async () => {
            mockRequireAuth.mockResolvedValue(null);

            const response = await GET();

            expect(response.status).toBe(401);
            expect(mockFindMany).not.toHaveBeenCalled();
        });

        it("retrieves only the signed-in user's skill statuses", async () => {
            const response = await GET();

            expect(response.status).toBe(200);
            expect(mockFindMany).toHaveBeenCalledWith({
                where: {
                    userId: testUser.id,
                },
                orderBy: {
                    skillName: "asc",
                },
            });
        });
    });

    describe("PUT /api/skill-statuses", () => {
        it("rejects unauthenticated requests", async () => {
            mockRequireAuth.mockResolvedValue(null);

            const response = await PUT(
                createPutRequest(
                    JSON.stringify({
                        skillName: "React",
                        status: "In Progress",
                    }),
                ),
            );

            expect(response.status).toBe(401);
            expect(mockUpsert).not.toHaveBeenCalled();
        });

        it("rejects malformed JSON", async () => {
            const response = await PUT(createPutRequest("{"));

            expect(response.status).toBe(400);
            expect(mockUpsert).not.toHaveBeenCalled();
        });

        it("rejects invalid request body structures", async () => {
            const response = await PUT(createPutRequest("null"));

            expect(response.status).toBe(400);
            expect(mockUpsert).not.toHaveBeenCalled();
        });

        it("rejects unexpected fields such as userId", async () => {
            const response = await PUT(
                createPutRequest(
                    JSON.stringify({
                        skillName: "React",
                        status: "In Progress",
                        userId: "another-user",
                    }),
                ),
            );

            expect(response.status).toBe(400);
            expect(mockUpsert).not.toHaveBeenCalled();
        });

        it("rejects invalid statuses", async () => {
            const response = await PUT(
                createPutRequest(
                    JSON.stringify({
                        skillName: "React",
                        status: "Expert",
                    }),
                ),
            );

            expect(response.status).toBe(400);
            expect(mockUpsert).not.toHaveBeenCalled();
        });
        it("rejects empty skill names", async () => {
            const response = await PUT(
                createPutRequest(
                    JSON.stringify({
                        skillName: "   ",
                        status: "In Progress",
                    }),
                ),
            );

            expect(response.status).toBe(400);
            expect(mockUpsert).not.toHaveBeenCalled();
        });

        it("rejects skill names longer than 100 characters", async () => {
            const response = await PUT(
                createPutRequest(
                    JSON.stringify({
                        skillName: "R".repeat(101),
                        status: "In Progress",
                    }),
                ),
            );

            expect(response.status).toBe(400);
            expect(mockUpsert).not.toHaveBeenCalled();
        });

        it("saves a skill status for the signed-in user", async () => {
            const response = await PUT(
                createPutRequest(
                    JSON.stringify({
                        skillName: "React",
                        status: "In Progress",
                    }),
                ),
            );

            expect(response.status).toBe(200);
            expect(mockUpsert).toHaveBeenCalledWith({
                where: {
                    userId_skillName: {
                        userId: testUser.id,
                        skillName: "React",
                    },
                },
                update: {
                    status: "In Progress",
                },
                create: {
                    userId: testUser.id,
                    skillName: "React",
                    status: "In Progress",
                },
            });
        });
    });
});
