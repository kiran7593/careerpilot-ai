"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setMessage("");
        setError("");

        if (!token) {
            setError("This reset link is invalid or missing its token.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Unable to reset your password.");
                return;
            }

            setMessage(data.message);
            setSuccess(true);
            setPassword("");
            setConfirmPassword("");
        } catch {
            setError("Unable to connect. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
                <h1 className="mb-2 text-3xl font-bold">Reset your password</h1>

                <p className="mb-8 text-sm text-slate-400">
                    Choose a new password for your CareerPilot AI account.
                </p>

                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="password" className="mb-2 block text-sm font-medium">
                                New password
                            </label>

                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                                minLength={8}
                                maxLength={72}
                                autoComplete="new-password"
                                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                                placeholder="At least 8 characters"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">
                                Confirm new password
                            </label>

                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                required
                                minLength={8}
                                maxLength={72}
                                autoComplete="new-password"
                                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                                placeholder="Enter your password again"
                            />
                        </div>

                        {error && (
                            <p role="alert" className="rounded-lg bg-red-950 p-3 text-sm text-red-300">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Resetting password..." : "Reset password"}
                        </button>
                    </form>
                )}

                {success && (
                    <div className="space-y-5">
                        <p role="status" className="rounded-lg bg-green-950 p-3 text-sm text-green-300">
                            {message}
                        </p>

                        <Link
                            href="/login"
                            className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold transition hover:bg-blue-500"
                        >
                            Back to sign in
                        </Link>
                    </div>
                )}

                {!success && (
                    <p className="mt-6 text-center text-sm text-slate-400">
                        Remembered your password?{" "}
                        <Link
                            href="/login"
                            className="font-medium text-blue-400 hover:text-blue-300"
                        >
                            Back to sign in
                        </Link>
                    </p>
                )}
            </div>
        </main>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                    Loading...
                </main>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}