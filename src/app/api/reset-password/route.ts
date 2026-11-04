
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/passwordReset";
import { checkRateLimit } from "@/lib/rateLimit";

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
            "reset-password",
            {
                limit: 10,
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
                { message: "Invalid password reset data." },
                { status: 400 }
            );
        }

        const bodyData = body as Record<string, unknown>;

        if (
            Object.keys(bodyData).some(
                (key) => !["token", "password"].includes(key)
            )
        ) {
            return NextResponse.json(
                { message: "Unexpected fields in request body." },
                { status: 400 }
            );
        }

        const token =
            typeof bodyData.token === "string" ? bodyData.token.trim() : "";

        const password =
            typeof bodyData.password === "string" ? bodyData.password : "";

        if (!token || !password) {
            return NextResponse.json(
                { message: "Reset token and new password are required." },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { message: "Password must be at least 8 characters long." },
                { status: 400 }
            );
        }

        if (Buffer.byteLength(password, "utf8") > 72) {
            return NextResponse.json(
                { message: "Password must not exceed 72 bytes." },
                { status: 400 }
            );
        }

        const tokenHash = hashResetToken(token);

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await prisma.$transaction(async (transaction) => {
            const resetRecord =
                await transaction.passwordResetToken.findUnique({
                    where: { tokenHash },
                    select: {
                        userId: true,
                        expiresAt: true,
                    },
                });

            if (!resetRecord || resetRecord.expiresAt <= new Date()) {
                return false;
            }

            const consumedToken =
                await transaction.passwordResetToken.deleteMany({
                    where: {
                        tokenHash,
                        userId: resetRecord.userId,
                        expiresAt: { gt: new Date() },
                    },
                });

            if (consumedToken.count !== 1) {
                return false;
            }

            await transaction.user.update({
                where: { id: resetRecord.userId },
                data: { passwordHash },
            });

            return true;
        });

        if (!result) {
            return NextResponse.json(
                { message: "This reset link is invalid or has expired." },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: "Your password has been reset successfully.",
        });
    } catch (error) {
        console.error("Reset password error:", error);

        return NextResponse.json(
            { message: "Unable to reset your password. Please try again." },
            { status: 500 }
        );
    }
}
