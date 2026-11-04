"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [resetUrl, setResetUrl] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setMessage("");
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            setResetUrl(data.resetUrl || "");

            if (!response.ok) {
                setError(data.message || "Unable to process your request.");
                return;
            }

            setMessage(data.message);
        } catch {
            setError("Unable to connect. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
                <h1 className="mb-2 text-3xl font-bold">Forgot your password?</h1>

                <p className="mb-8 text-sm text-slate-400">
                    Enter your account email address and we&apos;ll help you reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium">
                            Email address
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            maxLength={254}
                            autoComplete="email"
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                            placeholder="you@example.com"
                        />
                    </div>

                    {message && (
                        <p
                            role="status"
                            className="rounded-lg bg-green-950 p-3 text-sm text-green-300"
                        >
                            {message}
                        </p>
                    )}

                    {resetUrl && (
                        <div className="rounded-lg border border-blue-800 bg-blue-950 p-3 text-sm">
                            <p className="mb-2 text-blue-300">
                                Development reset link:
                            </p>

                            <Link
                                href={resetUrl}
                                className="break-all font-medium text-blue-400 underline hover:text-blue-300"
                            >
                                Open password reset page
                            </Link>
                        </div>
                    )}

                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg bg-red-950 p-3 text-sm text-red-300"
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Submitting..." : "Request password reset"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-400">
                    Remembered your password?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-blue-400 hover:text-blue-300"
                    >
                        Back to sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}
