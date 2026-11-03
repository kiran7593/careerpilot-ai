import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import SkillRoadmap from "./SkillRoadmap";
import type { SavedAnalysis } from "@/lib/jobAnalyzer";

const { mockUseSession } = vi.hoisted(() => ({
    mockUseSession: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
    useSession: mockUseSession,
}));

const mockAnalyses: SavedAnalysis[] = [
    {
        id: "1",
        jobTitle: "Frontend Developer",
        jobDescription: "React and TypeScript required.",
        userSkills: "React",
        matchingSkills: [{ name: "React", category: "Frameworks" }],
        missingSkills: [
            { name: "TypeScript", category: "Languages" },
            { name: "Next.js", category: "Frameworks" },
        ],
        matchPercentage: 33,
        createdAt: "2026-01-01T10:00:00.000Z",
        updatedAt: "2026-01-01T10:00:00.000Z",
    },
];

describe("SkillRoadmap", () => {
    beforeEach(() => {
        localStorage.clear();

        mockUseSession.mockReturnValue({
            data: {
                user: { id: "test-user" },
            },
            status: "authenticated",
        });

        vi.stubGlobal(
            "fetch",
            vi.fn().mockImplementation(
                async (_url: string, options?: RequestInit) => ({
                    ok: true,
                    json: async () =>
                        options?.method === "PUT" ? {} : [],
                }),
            ),
        );
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it("displays missing skills from saved job analyses", async () => {
        render(<SkillRoadmap analyses={mockAnalyses} />);

        expect(
            screen.getByRole("heading", {
                name: "Skill Development Roadmap",
            }),
        ).toBeTruthy();

        expect(screen.getByText("TypeScript")).toBeTruthy();
        expect(screen.getByText("Next.js")).toBeTruthy();

        await waitFor(() => {
            expect(
                (screen.getAllByRole("combobox")[0] as HTMLSelectElement).disabled,
            ).toBe(false);
        });
    });

    it("prioritizes skills that appear in more saved jobs", async () => {
        const multipleAnalyses: SavedAnalysis[] = [
            ...mockAnalyses,
            {
                ...mockAnalyses[0],
                id: "2",
                jobTitle: "Full Stack Developer",
                missingSkills: [
                    { name: "TypeScript", category: "Languages" },
                ],
            },
        ];

        render(<SkillRoadmap analyses={multipleAnalyses} />);

        const typescript = screen.getByText("TypeScript");
        const nextjs = screen.getByText("Next.js");

        expect(typescript.parentElement?.parentElement?.textContent).toContain(
            "Appears in 2 saved jobs",
        );

        expect(nextjs.parentElement?.parentElement?.textContent).toContain(
            "Appears in 1 saved job",
        );

        await waitFor(() => {
            expect(
                (screen.getAllByRole("combobox")[0] as HTMLSelectElement).disabled,
            ).toBe(false);
        });
    });

    it("updates skill status and completion percentage", async () => {
        localStorage.setItem(
            "careerpilot-skill-statuses",
            JSON.stringify({ TypeScript: "Not Started", "Next.js": "Not Started" }),
        );

        render(<SkillRoadmap analyses={mockAnalyses} />);

        const statusDropdowns = screen.getAllByRole("combobox");

        await waitFor(() => {
            expect((statusDropdowns[0] as HTMLSelectElement).disabled).toBe(false);
        });

        expect(screen.getByText("0%")).toBeTruthy();

        fireEvent.change(statusDropdowns[0], {
            target: { value: "Completed" },
        });

        await waitFor(() => {
            expect(screen.getByText("50%")).toBeTruthy();
        });

        expect(
            screen.getByText("Completed", { selector: "p" }).parentElement?.textContent,
        ).toContain("1");

        expect(fetch).toHaveBeenCalledWith(
            "/api/skill-statuses",
            expect.objectContaining({
                method: "PUT",
            }),
        );
    });
});