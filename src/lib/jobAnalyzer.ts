
export type SkillCategory = "Languages" | "Frameworks" | "Backend & Data" | "Tools";

export type SkillMatch = {
  name: string;
  category: SkillCategory;
};

const SKILL_CATALOG: { name: string; category: SkillCategory; keywords: string[] }[] = [
  {
    name: "JavaScript",
    category: "Languages",
    keywords: ["javascript"],
  },
  {
    name: "TypeScript",
    category: "Languages",
    keywords: ["typescript", "ts"],
  },
  {
    name: "HTML",
    category: "Languages",
    keywords: ["html"],
  },
  {
    name: "CSS",
    category: "Languages",
    keywords: ["css"],
  },
  {
    name: "Python",
    category: "Languages",
    keywords: ["python"],
  },
  {
    name: "SQL",
    category: "Languages",
    keywords: ["sql", "structured query language"],
  },
  {
    name: "React",
    category: "Frameworks",
    keywords: ["react", "react.js", "reactjs"],
  },
  {
    name: "Next.js",
    category: "Frameworks",
    keywords: ["next.js", "nextjs"],
  },
  {
    name: "Node.js",
    category: "Backend & Data",
    keywords: ["node.js", "nodejs"],
  },
  {
    name: "Express",
    category: "Backend & Data",
    keywords: ["express", "express.js"],
  },
  {
    name: "REST APIs",
    category: "Backend & Data",
    keywords: ["rest api", "restful api", "rest apis", "restful apis"],
  },
  {
    name: "PostgreSQL",
    category: "Backend & Data",
    keywords: ["postgresql", "postgres"],
  },
  {
    name: "SQLite",
    category: "Backend & Data",
    keywords: ["sqlite"],
  },
  {
    name: "Git",
    category: "Tools",
    keywords: ["git"],
  },
  {
    name: "GitHub",
    category: "Tools",
    keywords: ["github"],
  },
  {
    name: "Docker",
    category: "Tools",
    keywords: ["docker"],
  },
  {
    name: "AWS",
    category: "Tools",
    keywords: ["aws", "amazon web services"],
  },
];

function containsKeyword(text: string, keyword: string): boolean {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^a-z0-9])${escapedKeyword}($|[^a-z0-9])`, "i");

  return pattern.test(text);
}

export function analyzeJobDescription(description: string): SkillMatch[] {
  const normalizedDescription = description.trim();

  if (!normalizedDescription) {
    return [];
  }

  return SKILL_CATALOG.filter((skill) =>
    skill.keywords.some((keyword) =>
      containsKeyword(normalizedDescription, keyword),
    ),
  ).map(({ name, category }) => ({ name, category }));
}

export type SkillGapResult = {
  matchingSkills: SkillMatch[];
  missingSkills: SkillMatch[];
  matchPercentage: number;
};

export function compareSkills(
  jobSkills: SkillMatch[],
  userSkillsText: string,
): SkillGapResult {
  const matchingUserSkills = SKILL_CATALOG.filter((skill) =>
    skill.keywords.some((keyword) =>
      containsKeyword(userSkillsText, keyword),
    ),
  );

  const matchingNames = new Set(
    matchingUserSkills.map((skill) => skill.name),
  );

  const matchingSkills = jobSkills.filter((skill) =>
    matchingNames.has(skill.name),
  );

  const missingSkills = jobSkills.filter(
    (skill) => !matchingNames.has(skill.name),
  );

  const matchPercentage =
    jobSkills.length === 0
      ? 0
      : Math.round((matchingSkills.length / jobSkills.length) * 100);

  return {
    matchingSkills,
    missingSkills,
    matchPercentage,
  };
}