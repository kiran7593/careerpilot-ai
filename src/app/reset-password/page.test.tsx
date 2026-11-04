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
import ResetPasswordPage from "./page";

const { mockUseSearchParams } = vi.hoisted(() => ({
    mockUseSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useSearchParams: mockUseSearchParams,
}));

describe("ResetPasswordPage", () => {
    beforeEach(() => {
        mockUseSearchParams.mockReturnValue(
            new URLSearchParams("token=test-reset-token"),
        );

        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it("renders the password reset form", () => {
        render(<ResetPasswordPage />);

        expect(
            screen.getByRole("heading", {
                name: "Reset your password",
            }),
        ).toBeTruthy();

        expect(screen.getByLabelText("New password")).toBeTruthy();
        expect(screen.getByLabelText("Confirm new password")).toBeTruthy();

        expect(
            screen.getByRole("button", {
                name: "Reset password",
            }),
        ).toBeTruthy();
    });

    it("displays an error when passwords do not match", async () => {
        render(<ResetPasswordPage />);

        fireEvent.change(screen.getByLabelText("New password"), {
            target: { value: "password123" },
        });

        fireEvent.change(screen.getByLabelText("Confirm new password"), {
            target: { value: "different123" },
        });

        fireEvent.click(
            screen.getByRole("button", {
                name: "Reset password",
            }),
        );

        expect(screen.getByRole("alert").textContent).toContain(
            "Passwords do not match.",
        );

        expect(fetch).not.toHaveBeenCalled();
    });

    it("submits the new password successfully", async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: async () => ({
                message: "Your password has been reset successfully.",
            }),
        } as Response);

        render(<ResetPasswordPage />);

        fireEvent.change(screen.getByLabelText("New password"), {
            target: { value: "newpassword123" },
        });

        fireEvent.change(screen.getByLabelText("Confirm new password"), {
            target: { value: "newpassword123" },
        });

        fireEvent.click(
            screen.getByRole("button", {
                name: "Reset password",
            }),
        );

        await waitFor(() => {
            expect(screen.getByRole("status").textContent).toContain(
                "reset successfully",
            );
        });

        expect(fetch).toHaveBeenCalledWith(
            "/api/reset-password",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    token: "test-reset-token",
                    password: "newpassword123",
                }),
            }),
        );

        expect(
            screen.getByRole("link", {
                name: "Back to sign in",
            }),
        ).toBeTruthy();
    });

    it("displays an error when the reset token is missing", () => {
        mockUseSearchParams.mockReturnValue(new URLSearchParams());

        render(<ResetPasswordPage />);

        fireEvent.change(screen.getByLabelText("New password"), {
            target: { value: "newpassword123" },
        });

        fireEvent.change(screen.getByLabelText("Confirm new password"), {
            target: { value: "newpassword123" },
        });

        fireEvent.click(
            screen.getByRole("button", {
                name: "Reset password",
            }),
        );

        expect(screen.getByRole("alert").textContent).toContain(
            "invalid or missing its token",
        );

        expect(fetch).not.toHaveBeenCalled();
    });

    it("displays an API error when the reset request fails", async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: false,
            json: async () => ({
                message: "This reset link is invalid or has expired.",
            }),
        } as Response);

        render(<ResetPasswordPage />);

        fireEvent.change(screen.getByLabelText("New password"), {
            target: { value: "newpassword123" },
        });

        fireEvent.change(screen.getByLabelText("Confirm new password"), {
            target: { value: "newpassword123" },
        });

        fireEvent.click(
            screen.getByRole("button", {
                name: "Reset password",
            }),
        );

        await waitFor(() => {
            expect(screen.getByRole("alert").textContent).toContain(
                "invalid or has expired",
            );
        });
    });
});
