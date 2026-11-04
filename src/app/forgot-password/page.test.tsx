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
import ForgotPasswordPage from "./page";

describe("ForgotPasswordPage", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it("renders the forgot-password form", () => {
        render(<ForgotPasswordPage />);

        expect(
            screen.getByRole("heading", {
                name: "Forgot your password?",
            }),
        ).toBeTruthy();

        expect(screen.getByLabelText("Email address")).toBeTruthy();

        expect(
            screen.getByRole("button", {
                name: "Request password reset",
            }),
        ).toBeTruthy();

        expect(
            screen.getByRole("link", {
                name: "Back to sign in",
            }),
        ).toBeTruthy();
    });

    it("submits the email and displays the success message", async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: async () => ({
                message: "If an account exists with that email, password reset instructions will be provided.",
            }),
        } as Response);

        render(<ForgotPasswordPage />);

        fireEvent.change(screen.getByLabelText("Email address"), {
            target: { value: "test@example.com" },
        });

        fireEvent.click(
            screen.getByRole("button", {
                name: "Request password reset",
            }),
        );

        await waitFor(() => {
            expect(screen.getByRole("status").textContent).toContain(
                "If an account exists",
            );
        });

        expect(fetch).toHaveBeenCalledWith(
            "/api/forgot-password",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ email: "test@example.com" }),
            }),
        );
    });

    it("displays the development reset link when provided", async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: async () => ({
                message: "Reset instructions are ready.",
                resetUrl: "http://localhost:3000/reset-password?token=test-token",
            }),
        } as Response);

        render(<ForgotPasswordPage />);

        fireEvent.change(screen.getByLabelText("Email address"), {
            target: { value: "test@example.com" },
        });

        fireEvent.click(
            screen.getByRole("button", {
                name: "Request password reset",
            }),
        );

        await waitFor(() => {
            expect(
                screen.getByRole("link", {
                    name: "Open password reset page",
                }).getAttribute("href"),
            ).toBe(
                "http://localhost:3000/reset-password?token=test-token",
            );
        });
    });

    it("displays an error when the API request fails", async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: false,
            json: async () => ({
                message: "Unable to process your request.",
            }),
        } as Response);

        render(<ForgotPasswordPage />);

        fireEvent.change(screen.getByLabelText("Email address"), {
            target: { value: "test@example.com" },
        });

        fireEvent.click(
            screen.getByRole("button", {
                name: "Request password reset",
            }),
        );

        await waitFor(() => {
            expect(screen.getByRole("alert").textContent).toContain(
                "Unable to process your request.",
            );
        });
    });
});
