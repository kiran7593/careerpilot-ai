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

// GET: Retrieve only the signed-in user's analyses.
export async function GET() {
    try {
        const user = await requireAuth();

        if (!user) {
            return NextResponse.json(
                { message: "You must be signed in." },
                { status: 401 }
            );
        }

        const analyses = await prisma.savedAnalysis.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(analyses);
    } catch (error) {
        console.error("Fetch analyses error:", error);

        return NextResponse.json(
            { message: "Unable to retrieve analyses." },
            { status: 500 }
        );
    }
}

// POST: Save a new analysis for the signed-in user.
export async function POST(request: Request) {
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
                { message: "Invalid analysis data." },
                { status: 400 }
            );
        }

        const bodyData = body as Record<string, unknown>;

        const allowedFields = [
            "id",
            "jobTitle",
            "jobDescription",
            "userSkills",
            "matchingSkills",
            "missingSkills",
            "matchPercentage",
            "createdAt",
            "updatedAt",
        ];

        if (Object.keys(bodyData).some((key) => !allowedFields.includes(key))) {
            return NextResponse.json(
                { message: "Unexpected fields in request body." },
                { status: 400 }
            );
        }

        const {
            id,
            jobTitle,
            jobDescription,
            userSkills,
            matchingSkills,
            missingSkills,
            matchPercentage,
            createdAt,
            updatedAt,
        } = bodyData;

        if (
            (id !== undefined && (typeof id !== "string" || !id.trim())) ||
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
            matchPercentage > 100 ||
            (createdAt !== undefined &&
                (typeof createdAt !== "string" || Number.isNaN(Date.parse(createdAt)))) ||
            (updatedAt !== undefined &&
                (typeof updatedAt !== "string" || Number.isNaN(Date.parse(updatedAt))))
        ) {
            return NextResponse.json(
                { message: "Invalid analysis data." },
                { status: 400 }
            );
        }

        if (id) {
            const existingAnalysis = await prisma.savedAnalysis.findUnique({
                where: { id },
            });

            if (existingAnalysis) {
                if (existingAnalysis.userId !== user.id) {
                    return NextResponse.json(
                        { message: "Analysis ID already exists." },
                        { status: 409 }
                    );
                }

                return NextResponse.json(existingAnalysis);
            }
        }

        const analysis = await prisma.savedAnalysis.create({
            data: {
                ...(id ? { id } : {}),
                userId: user.id,
                jobTitle: jobTitle.trim(),
                jobDescription,
                userSkills,
                matchingSkills,
                missingSkills,
                matchPercentage,
                ...(createdAt ? { createdAt: new Date(createdAt) } : {}),
                ...(updatedAt ? { updatedAt: new Date(updatedAt) } : {}),
            },
        });

        return NextResponse.json(analysis, { status: 201 });
    } catch (error) {
        console.error("Save analysis error:", error);

        return NextResponse.json(
            { message: "Unable to save analysis." },
            { status: 500 }
        );
    }
}