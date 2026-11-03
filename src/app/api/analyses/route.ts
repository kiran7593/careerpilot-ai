import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

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

    const body = await request.json();

    const {
      jobTitle,
      jobDescription,
      userSkills,
      matchingSkills,
      missingSkills,
      matchPercentage,
    } = body;

    if (
      typeof jobTitle !== "string" ||
      !jobTitle.trim() ||
      typeof jobDescription !== "string" ||
      typeof userSkills !== "string" ||
      !Array.isArray(matchingSkills) ||
      !Array.isArray(missingSkills) ||
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

    const analysis = await prisma.savedAnalysis.create({
      data: {
        userId: user.id,
        jobTitle: jobTitle.trim(),
        jobDescription,
        userSkills,
        matchingSkills,
        missingSkills,
        matchPercentage,
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