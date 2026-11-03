import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

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
      !id ||
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