
import { describe, expect, it } from "vitest";
import { analyzeJobDescription } from "./jobAnalyzer";

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
