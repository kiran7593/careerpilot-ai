import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

const validStatuses = [
  "Not Started",
  "In Progress",
  "Completed",
] as const;

// GET: Retrieve the signed-in user's skill statuses.
export async function GET() {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { message: "You must be signed in." },
        { status: 401 }
      );
    }

    const skillStatuses = await prisma.skillStatus.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        skillName: "asc",
      },
    });

    return NextResponse.json(skillStatuses);
  } catch (error) {
    console.error("Fetch skill statuses error:", error);

    return NextResponse.json(
      { message: "Unable to retrieve skill statuses." },
      { status: 500 }
    );
  }
}

// PUT: Save or update one skill's status.
export async function PUT(request: Request) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { message: "You must be signed in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const skillName =
      typeof body.skillName === "string"
        ? body.skillName.trim()
        : "";

    const status = body.status;

    if (
      !skillName ||
      skillName.length > 100 ||
      !validStatuses.includes(status)
    ) {
      return NextResponse.json(
        { message: "Invalid skill status data." },
        { status: 400 }
      );
    }

    const skillStatus = await prisma.skillStatus.upsert({
      where: {
        userId_skillName: {
          userId: user.id,
          skillName,
        },
      },
      update: {
        status,
      },
      create: {
        userId: user.id,
        skillName,
        status,
      },
    });

    return NextResponse.json(skillStatus);
  } catch (error) {
    console.error("Save skill status error:", error);

    return NextResponse.json(
      { message: "Unable to save skill status." },
      { status: 500 }
    );
  }
}