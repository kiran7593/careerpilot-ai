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
                { message: "Invalid skill status data." },
                { status: 400 }
            );
        }

        const bodyData = body as Record<string, unknown>;

        const allowedFields = ["skillName", "status"];

        if (Object.keys(bodyData).some((key) => !allowedFields.includes(key))) {
            return NextResponse.json(
                { message: "Unexpected fields in request body." },
                { status: 400 }
            );
        }

        const skillName =
            typeof bodyData.skillName === "string"
                ? bodyData.skillName.trim()
                : "";

        const status = bodyData.status;
        if (
            !skillName ||
            skillName.length > 100 ||
            typeof status !== "string" ||
            !validStatuses.some((validStatus) => validStatus === status)
        ) {
            return NextResponse.json(
                { message: "Invalid skill status data." },
                { status: 400 }
            );
        }

        const validStatus = status as (typeof validStatuses)[number];
        const prismaStatus = {
            "Not Started": "NOT_STARTED",
            "In Progress": "IN_PROGRESS",
            "Completed": "COMPLETED",
        } as const;

        const databaseStatus = prismaStatus[validStatus];

        const skillStatus = await prisma.skillStatus.upsert({
            where: {
                userId_skillName: {
                    userId: user.id,
                    skillName,
                },
            },
            update: {
                status: databaseStatus,
            },
            create: {
                userId: user.id,
                skillName,
                status: databaseStatus,
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
