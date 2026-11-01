import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import SkillRoadmap from "./SkillRoadmap";
import type { SavedAnalysis } from "@/lib/jobAnalyzer";

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
    });

    afterEach(() => {
        cleanup();
    });

    it("displays missing skills from saved job analyses", () => {
        render(<SkillRoadmap analyses={mockAnalyses} />);

        expect(
            screen.getByRole("heading", {
                name: "Skill Development Roadmap",
            }),
        ).toBeTruthy();

        expect(screen.getByText("TypeScript")).toBeTruthy();
        expect(screen.getByText("Next.js")).toBeTruthy();
    });

    it("prioritizes skills that appear in more saved jobs", () => {
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
    });

    it("updates skill status and completion percentage", () => {
        render(<SkillRoadmap analyses={mockAnalyses} />);

        const statusDropdowns = screen.getAllByRole("combobox");

        expect(screen.getByText("0%")).toBeTruthy();

        fireEvent.change(statusDropdowns[0], {
            target: { value: "Completed" },
        });

        expect(screen.getByText("50%")).toBeTruthy();
        expect(
            screen.getByText("Completed", { selector: "p" }).parentElement?.textContent,
        ).toContain("1");
    });
});