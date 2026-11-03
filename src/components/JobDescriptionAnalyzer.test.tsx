import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
} from "@testing-library/react";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import JobDescriptionAnalyzer from "./JobDescriptionAnalyzer";

const { mockUseSession } = vi.hoisted(() => ({
    mockUseSession: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
    useSession: mockUseSession,
}));

describe("JobDescriptionAnalyzer", () => {
    beforeEach(() => {
        mockUseSession.mockReturnValue({
            data: {
                user: { id: "test-user" },
            },
            status: "authenticated",
        });

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => [],
            }),
        );
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it("renders the form fields and submit button", async () => {
        await act(async () => {
            render(<JobDescriptionAnalyzer />);
        });

        expect(screen.getByLabelText("Target job title")).toBeTruthy();
        expect(screen.getByLabelText("Job description")).toBeTruthy();
        expect(
            screen.getByRole("button", { name: "Prepare job analysis" }),
        ).toBeTruthy();
    });

    it("shows an error when the job title is empty", async () => {
        await act(async () => {
            render(<JobDescriptionAnalyzer />);
        });

        fireEvent.change(screen.getByLabelText("Job description"), {
            target: {
                value:
                    "We are looking for a developer with React and TypeScript experience.",
            },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Prepare job analysis" }),
        );

        expect(
            screen.getByRole("alert").textContent,
        ).toBe("Please enter the target job title.");
    });

    it("shows an error when the description is too short", async () => {
        await act(async () => {
            render(<JobDescriptionAnalyzer />);
        });

        fireEvent.change(screen.getByLabelText("Target job title"), {
            target: { value: "Junior Front-End Developer" },
        });

        fireEvent.change(screen.getByLabelText("Job description"), {
            target: { value: "React and TypeScript experience required." },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Prepare job analysis" }),
        );

        expect(screen.getByRole("alert").textContent).toBe(
            "Please enter a job description with at least 50 characters.",
        );
    });

    it("displays detected skills after a valid submission", async () => {
        await act(async () => {
            render(<JobDescriptionAnalyzer />);
        });

        fireEvent.change(screen.getByLabelText("Target job title"), {
            target: { value: "Junior Front-End Developer" },
        });

        fireEvent.change(screen.getByLabelText("Job description"), {
            target: {
                value:
                    "We need React and TypeScript skills to build modern web applications.",
            },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Prepare job analysis" }),
        );

        expect(screen.getByRole("status").textContent).toBe(
            "Job description analyzed successfully.",
        );
        expect(
            screen.getByRole("heading", {
                name: "Skills found in the job description",
            }),
        ).toBeTruthy();
        expect(screen.getAllByText("React").length).toBeGreaterThan(0);
        expect(screen.getAllByText("TypeScript").length).toBeGreaterThan(0);
    });

    it("shows a message when no known skills are detected", async () => {
        await act(async () => {
            render(<JobDescriptionAnalyzer />);
        });

        fireEvent.change(screen.getByLabelText("Target job title"), {
            target: { value: "Junior Developer" },
        });

        fireEvent.change(screen.getByLabelText("Job description"), {
            target: {
                value:
                    "Strong communication, teamwork, problem solving, and organizational skills are required.",
            },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Prepare job analysis" }),
        );

        expect(
            screen.getByText(/No skills from our current catalog were detected/),
        ).toBeTruthy();
    });

    it("shows the correct skill match percentage and skill gaps", async () => {
        await act(async () => {
            render(<JobDescriptionAnalyzer />);
        });

        fireEvent.change(screen.getByLabelText("Target job title"), {
            target: { value: "Junior Front-End Developer" },
        });

        fireEvent.change(screen.getByLabelText("Your current skills"), {
            target: { value: "React, JavaScript, HTML, CSS" },
        });

        fireEvent.change(screen.getByLabelText("Job description"), {
            target: {
                value:
                    "We need React, JavaScript, HTML, CSS, TypeScript, and Next.js experience to build modern web applications.",
            },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Prepare job analysis" }),
        );

        expect(screen.getByText("67%")).toBeTruthy();
        expect(screen.getByText("Matching skills (4)")).toBeTruthy();
        expect(screen.getByText("Skills to develop (2)")).toBeTruthy();
    });
});