import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredRateLimits } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const deletedCount = await cleanupExpiredRateLimits();

    return NextResponse.json({
      message: "Expired rate-limit records cleaned up.",
      deletedCount,
    });
  } catch (error) {
    console.error("Rate-limit cleanup failed:", error);

    return NextResponse.json(
      { message: "Unable to clean up expired rate-limit records." },
      { status: 500 }
    );
  }
}
