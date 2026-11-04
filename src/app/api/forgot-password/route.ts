import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateResetToken } from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/resend";
import { checkRateLimit } from "@/lib/rateLimit";

const successMessage =
    "If an account exists with that email, password reset instructions will be provided.";

export async function POST(request: Request) {
    try {
        const realIp = request.headers.get("x-real-ip");
        const forwardedFor = request.headers.get("x-forwarded-for");

        const clientIp =
            realIp?.trim() ||
            forwardedFor?.split(",")[0]?.trim() ||
            "unknown";

        const rateLimit = await checkRateLimit(
            clientIp,
            "forgot-password",
            {
                limit: 5,
                windowMs: 15 * 60 * 1000,
            }
        );

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { message: "Too many requests. Please try again later." },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(rateLimit.retryAfterSeconds),
                    },
                }
            );
        }
        let body: unknown;

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { message: "Invalid JSON request body." },
                { status: 400 }
            );
        }

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return NextResponse.json(
                { message: "Invalid request data." },
                { status: 400 }
            );
        }

        const bodyData = body as Record<string, unknown>;

        if (
            Object.keys(bodyData).some((key) => key !== "email") ||
            typeof bodyData.email !== "string"
        ) {
            return NextResponse.json(
                { message: "Please provide a valid email address." },
                { status: 400 }
            );
        }

        const email = bodyData.email.trim().toLowerCase();

        if (
            !email ||
            email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            return NextResponse.json(
                { message: "Please provide a valid email address." },
                { status: 400 }
            );
        }

        const emailRateLimit = await checkRateLimit(
            email,
            "forgot-password-email",
            {
                limit: 3,
                windowMs: 15 * 60 * 1000,
            }
        );

        if (!emailRateLimit.allowed) {
            return NextResponse.json(
                { message: successMessage }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ message: successMessage });
        }

        const { token, tokenHash, expiresAt } = generateResetToken();

        await prisma.$transaction([
            prisma.passwordResetToken.deleteMany({
                where: { userId: user.id },
            }),
            prisma.passwordResetToken.create({
                data: {
                    tokenHash,
                    userId: user.id,
                    expiresAt,
                },
            }),
        ]);

        const baseUrl =
            process.env.APP_URL ||
            process.env.NEXTAUTH_URL ||
            (process.env.NODE_ENV === "development"
                ? "http://localhost:3000"
                : undefined);

        if (!baseUrl) {
            throw new Error("APP_URL is not configured.");
        }

        const parsedBaseUrl = new URL(baseUrl);

        if (
            parsedBaseUrl.protocol !== "https:" &&
            process.env.NODE_ENV !== "development"
        ) {
            throw new Error("A secure HTTPS APP_URL is required.");
        }

        if (parsedBaseUrl.username || parsedBaseUrl.password) {
            throw new Error("APP_URL must not contain credentials.");
        }

        const resetUrl = new URL("/reset-password", parsedBaseUrl.origin);

        resetUrl.searchParams.set("token", token);

        const emailResult = await sendPasswordResetEmail(
            email,
            resetUrl.toString()
        );

        if (emailResult.error) {
            throw new Error("Password reset email could not be sent.");
        }

        // Development only: expose the reset link for local testing.
        if (process.env.NODE_ENV === "development") {
            return NextResponse.json({
                message: successMessage,
                resetUrl: resetUrl.toString(),
            });
        }

        return NextResponse.json({ message: successMessage });

    } catch (error) {
        console.error("Forgot password error:", error);

        return NextResponse.json(
            { message: "Unable to process your request. Please try again." },
            { status: 500 }
        );
    }
}
