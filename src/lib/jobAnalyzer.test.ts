
import { describe, expect, it } from "vitest";
import { analyzeJobDescription, compareSkills } from "./jobAnalyzer";

describe("analyzeJobDescription", () => {
  it("returns an empty array for an empty description", () => {
    expect(analyzeJobDescription("")).toEqual([]);
  });

  it("detects technical skills in a job description", () => {
    const description =
      "We are looking for a developer with React, TypeScript, Node.js, and PostgreSQL experience.";

    expect(analyzeJobDescription(description)).toEqual([
      { name: "TypeScript", category: "Languages" },
      { name: "React", category: "Frameworks" },
      { name: "Node.js", category: "Backend & Data" },
      { name: "PostgreSQL", category: "Backend & Data" },
    ]);
  });

  it("recognizes skills regardless of capitalization", () => {
    const description = "Experience with REACT and JAVASCRIPT is required.";

    expect(analyzeJobDescription(description)).toEqual([
      { name: "JavaScript", category: "Languages" },
      { name: "React", category: "Frameworks" },
    ]);
  });

  it("does not detect a skill inside a longer unrelated word", () => {
    expect(analyzeJobDescription("The role requires practical experience.")).toEqual(
      [],
    );
  });

  it("returns an empty array when no catalogued skills are found", () => {
    expect(
      analyzeJobDescription("Strong communication and teamwork skills are required."),
    ).toEqual([]);
  });
});

describe("compareSkills", () => {
  it("identifies matching and missing skills", () => {
    const jobSkills = analyzeJobDescription(
      "React, TypeScript, Node.js, and PostgreSQL experience required.",
    );

    const result = compareSkills(
      jobSkills,
      "React, TypeScript, HTML, CSS",
    );

    expect(result.matchingSkills.map((skill) => skill.name)).toEqual([
      "TypeScript",
      "React",
    ]);

    expect(result.missingSkills.map((skill) => skill.name)).toEqual([
      "Node.js",
      "PostgreSQL",
    ]);

    expect(result.matchPercentage).toBe(50);
  });

  it("returns 100 percent when all required skills match", () => {
    const jobSkills = analyzeJobDescription("React and TypeScript required.");

    const result = compareSkills(
      jobSkills,
      "React, TypeScript",
    );

    expect(result.matchPercentage).toBe(100);
    expect(result.missingSkills).toEqual([]);
  });

  it("returns zero percent when no skills match", () => {
    const jobSkills = analyzeJobDescription("React and TypeScript required.");

    const result = compareSkills(jobSkills, "Python, SQL");

    expect(result.matchPercentage).toBe(0);
    expect(result.matchingSkills).toEqual([]);
  });

  it("returns zero percent when no job skills are detected", () => {
    const result = compareSkills([], "React, TypeScript");

    expect(result.matchPercentage).toBe(0);
    expect(result.matchingSkills).toEqual([]);
    expect(result.missingSkills).toEqual([]);
  });
});
