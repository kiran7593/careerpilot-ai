import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

const validSkillCategories = [
    "Languages",
    "Frameworks",
    "Backend & Data",
    "Tools",
];

function isValidSkillMatch(skill: unknown): boolean {
    if (!skill || typeof skill !== "object" || Array.isArray(skill)) {
        return false;
    }

    const skillData = skill as Record<string, unknown>;

    return (
        typeof skillData.name === "string" &&
        skillData.name.trim().length > 0 &&
        typeof skillData.category === "string" &&
        validSkillCategories.includes(skillData.category)
    );
}

type RouteContext = {
    params: Promise<{ id: string }>;
};

// PUT: Update an analysis owned by the signed-in user.
export async function PUT(
    request: Request,
    context: RouteContext
) {
    try {
        const user = await requireAuth();

        if (!user) {
            return NextResponse.json(
                { message: "You must be signed in." },
                { status: 401 }
            );
        }

        const { id } = await context.params;

        if (typeof id !== "string" || !id.trim() || id.length > 100) {
            return NextResponse.json(
                { message: "Invalid analysis ID." },
                { status: 400 }
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
                { message: "Invalid analysis data." },
                { status: 400 }
            );
        }

        const bodyData = body as Record<string, unknown>;
        const allowedFields = [
            "jobTitle",
            "jobDescription",
            "userSkills",
            "matchingSkills",
            "missingSkills",
            "matchPercentage",
        ];

        if (Object.keys(bodyData).some((key) => !allowedFields.includes(key))) {
            return NextResponse.json(
                { message: "Unexpected fields in request body." },
                { status: 400 }
            );
        }

        const {
            jobTitle,
            jobDescription,
            userSkills,
            matchingSkills,
            missingSkills,
            matchPercentage,
        } = bodyData;

        if (
            typeof jobTitle !== "string" ||
            !jobTitle.trim() ||
            jobTitle.length > 200 ||
            typeof jobDescription !== "string" ||
            jobDescription.length > 20000 ||
            typeof userSkills !== "string" ||
            userSkills.length > 5000 ||
            !Array.isArray(matchingSkills) ||
            matchingSkills.length > 100 ||
            !matchingSkills.every(isValidSkillMatch) ||
            !Array.isArray(missingSkills) ||
            missingSkills.length > 100 ||
            !missingSkills.every(isValidSkillMatch) ||
            typeof matchPercentage !== "number" ||
            !Number.isFinite(matchPercentage) ||
            matchPercentage < 0 ||
            matchPercentage > 100
        ) {
            return NextResponse.json(
                { message: "Invalid analysis data." },
                { status: 400 }
            );
        }

        const result = await prisma.savedAnalysis.updateMany({
            where: {
                id,
                userId: user.id,
            },
            data: {
                jobTitle: jobTitle.trim(),
                jobDescription,
                userSkills,
                matchingSkills,
                missingSkills,
                matchPercentage,
            },
        });

        if (result.count === 0) {
            return NextResponse.json(
                { message: "Analysis not found." },
                { status: 404 }
            );
        }

        const updatedAnalysis = await prisma.savedAnalysis.findFirst({
            where: {
                id,
                userId: user.id,
            },
        });

        return NextResponse.json(updatedAnalysis);
    } catch (error) {
        console.error("Update analysis error:", error);

        return NextResponse.json(
            { message: "Unable to update analysis." },
            { status: 500 }
        );
    }
}

// DELETE: Delete an analysis owned by the signed-in user.
export async function DELETE(
    request: Request,
    context: RouteContext
) {
    try {
        const user = await requireAuth();

        if (!user) {
            return NextResponse.json(
                { message: "You must be signed in." },
                { status: 401 }
            );
        }

        const { id } = await context.params;

        if (typeof id !== "string" || !id.trim() || id.length > 100) {
            return NextResponse.json(
                { message: "Invalid analysis ID." },
                { status: 400 }
            );
        }

        const result = await prisma.savedAnalysis.deleteMany({
            where: {
                id,
                userId: user.id,
            },
        });

        if (result.count === 0) {
            return NextResponse.json(
                { message: "Analysis not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Analysis deleted successfully.",
        });
    } catch (error) {
        console.error("Delete analysis error:", error);

        return NextResponse.json(
            { message: "Unable to delete analysis." },
            { status: 500 }
        );
    }
}
