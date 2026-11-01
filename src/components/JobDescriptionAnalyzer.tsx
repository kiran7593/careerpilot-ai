"use client";

import { useEffect, useState } from "react";
import {
    analyzeJobDescription,
    compareSkills,
    type SavedAnalysis,
    type SkillGapResult,
    type SkillMatch,
} from "@/lib/jobAnalyzer";

function getLearningRecommendation(skillName: string): string {
    const recommendations: Record<string, string> = {
        JavaScript: "Practice variables, functions, arrays, objects, and asynchronous programming.",
        TypeScript: "Learn types, interfaces, type narrowing, and how to type React components.",
        HTML: "Practice semantic HTML, accessible forms, and page structure.",
        CSS: "Build responsive layouts using Flexbox, Grid, and media queries.",
        React: "Practice components, props, state, hooks, and handling user interactions.",
        "Next.js": "Learn App Router, layouts, server and client components, and data fetching.",
        Python: "Practice Python syntax, functions, collections, and small automation scripts.",
        SQL: "Practice SELECT queries, JOINs, filtering, grouping, and database relationships.",
        "Node.js": "Learn modules, asynchronous code, environment variables, and server-side JavaScript.",
        Express: "Build REST endpoints, middleware, request validation, and error handling.",
        "REST APIs": "Practice HTTP methods, status codes, JSON responses, and API error handling.",
        PostgreSQL: "Practice table design, constraints, joins, indexes, and parameterized queries.",
        SQLite: "Build a small application that stores and retrieves data with SQL.",
        Git: "Practice branching, commits, merging, and resolving conflicts.",
        GitHub: "Learn pull requests, repository documentation, and GitHub Actions.",
        Docker: "Learn images, containers, Dockerfiles, and environment configuration.",
        AWS: "Explore core cloud concepts, IAM permissions, and deploying a small application.",
    };

    return (
        recommendations[skillName] ??
        `Study the fundamentals of ${skillName} and build a small project to practice it.`
    );
}

const LEARNING_RESOURCES: Record<string, { label: string; url: string }> = {
    JavaScript: {
        label: "MDN JavaScript Guide",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    },
    TypeScript: {
        label: "TypeScript Handbook",
        url: "https://www.typescriptlang.org/docs/handbook/intro.html",
    },
    HTML: {
        label: "MDN HTML Guide",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
    },
    CSS: {
        label: "MDN CSS Guide",
        url: "https://developer.mozilla.org/en-US/docs/Web/CSS",
    },
    React: {
        label: "React Documentation",
        url: "https://react.dev/learn",
    },
    "Next.js": {
        label: "Next.js Learn",
        url: "https://nextjs.org/learn",
    },
    Docker: {
        label: "Docker Get Started",
        url: "https://docs.docker.com/get-started/",
    },
    AWS: {
        label: "AWS Skill Builder",
        url: "https://skillbuilder.aws/",
    },
    "REST APIs": {
        label: "MDN HTTP Guide",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTTP",
    },
    SQL: {
        label: "PostgreSQL Tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial.html",
    },
    Git: {
        label: "Git Documentation",
        url: "https://git-scm.com/doc",
    },
    GitHub: {
        label: "GitHub Skills",
        url: "https://skills.github.com/",
    },
};

export default function JobDescriptionAnalyzer() {
    const [jobTitle, setJobTitle] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [userSkills, setUserSkills] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [detectedSkills, setDetectedSkills] = useState<SkillMatch[]>([]);
    const [skillGap, setSkillGap] = useState<SkillGapResult | null>(null);
    const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
    const [editingAnalysisId, setEditingAnalysisId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const storedAnalyses = localStorage.getItem("careerpilot-saved-analyses");

        if (storedAnalyses) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore browser data after mounting.
            setSavedAnalyses(JSON.parse(storedAnalyses) as SavedAnalysis[]);
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) {
            return;
        }

        localStorage.setItem(
            "careerpilot-saved-analyses",
            JSON.stringify(savedAnalyses),
        );
    }, [savedAnalyses, isLoaded]);

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!jobTitle.trim()) {
            setError("Please enter the target job title.");
            return;
        }

        if (jobDescription.trim().length < 50) {
            setError("Please enter a job description with at least 50 characters.");
            return;
        }

        const skills = analyzeJobDescription(jobDescription);
        setDetectedSkills(skills);

        const analysisResult = compareSkills(skills, userSkills);
        setSkillGap(analysisResult);

        setSuccess("Job description analyzed successfully.");
    }

    function handleSaveAnalysis() {
        if (!skillGap) {
            return;
        }

        const newAnalysis: SavedAnalysis = {
            id: editingAnalysisId ?? crypto.randomUUID(),
            jobTitle: jobTitle.trim(),
            jobDescription,
            userSkills,
            matchingSkills: skillGap.matchingSkills,
            missingSkills: skillGap.missingSkills,
            matchPercentage: skillGap.matchPercentage,
        };

        setSavedAnalyses((previousAnalyses) => {
            if (editingAnalysisId) {
                return previousAnalyses.map((analysis) =>
                    analysis.id === editingAnalysisId ? newAnalysis : analysis,
                );
            }

            return [...previousAnalyses, newAnalysis];
        });

        setEditingAnalysisId(null);
        setSuccess(
            editingAnalysisId
                ? "Analysis updated successfully."
                : "Analysis saved successfully.",
        );
    }

    function handleDeleteAnalysis(id: string) {
        setSavedAnalyses((previousAnalyses) =>
            previousAnalyses.filter((analysis) => analysis.id !== id),
        );
    }

    function handleEditAnalysis(analysis: SavedAnalysis) {
        setEditingAnalysisId(analysis.id);
        setJobTitle(analysis.jobTitle);
        setJobDescription(analysis.jobDescription ?? "");
        setUserSkills(analysis.userSkills ?? "");
        
        setDetectedSkills(
            analyzeJobDescription(analysis.jobDescription),
        );

        setSkillGap({
            matchingSkills: analysis.matchingSkills,
            missingSkills: analysis.missingSkills,
            matchPercentage: analysis.matchPercentage,
        });

        setError("");
        setSuccess("Saved analysis loaded. You can now edit it.");
    }

    return (
        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8">
            <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">
                    Job description analyzer
                </p>
                <h2 className="mt-3 text-2xl font-bold text-white">
                    Understand your target role
                </h2>
                <p className="mt-2 leading-7 text-slate-400">
                    Enter a job title and paste the job description to prepare it for
                    analysis.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label
                        htmlFor="job-title"
                        className="mb-2 block text-sm font-medium text-slate-200"
                    >
                        Target job title
                    </label>
                    <input
                        id="job-title"
                        type="text"
                        value={jobTitle}
                        onChange={(event) => setJobTitle(event.target.value)}
                        placeholder="e.g. Junior Front-End Developer"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                    />
                </div>

                <div>
                    <label
                        htmlFor="user-skills"
                        className="mb-2 block text-sm font-medium text-slate-200"
                    >
                        Your current skills
                    </label>

                    <textarea
                        id="user-skills"
                        value={userSkills}
                        onChange={(event) => setUserSkills(event.target.value)}
                        placeholder="e.g. React, TypeScript, JavaScript, HTML, CSS"
                        rows={3}
                        className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                    />

                    <p className="mt-2 text-sm text-slate-400">
                        Separate your skills with commas.
                    </p>
                </div>

                <div>
                    <label
                        htmlFor="analyzer-job-description"
                        className="mb-2 block text-sm font-medium text-slate-200"
                    >
                        Job description
                    </label>
                    <textarea
                        id="analyzer-job-description"
                        value={jobDescription}
                        onChange={(event) => setJobDescription(event.target.value)}
                        placeholder="Paste the full job description here..."
                        rows={7}
                        className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                    />
                    <p className="mt-2 text-right text-xs text-slate-500">
                        {jobDescription.trim().length} characters
                    </p>
                </div>

                {error && (
                    <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
                        {error}
                    </p>
                )}

                {success && (
                    <p
                        role="status"
                        className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300"
                    >
                        {success}
                    </p>
                )}

                {success && (
                    <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-950 p-5">
                        <div>
                            <h3 className="text-lg font-semibold text-white">
                                Skills found in the job description
                            </h3>
                            <p className="mt-1 text-sm text-slate-400">
                                Target role: {jobTitle.trim()}
                            </p>
                        </div>

                        {skillGap && (
                            <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-4">
                                <p className="text-sm text-indigo-200">Your skill match</p>
                                <p className="mt-1 text-3xl font-bold text-white">
                                    {skillGap.matchPercentage}%
                                </p>
                                <p className="mt-1 text-sm text-slate-300">
                                    of the detected job skills match your current skills
                                </p>
                            </div>
                        )}

                        {skillGap && (
                            <button
                                type="button"
                                onClick={handleSaveAnalysis}
                                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                            >
                                {editingAnalysisId ? "Update Analysis" : "Save Analysis"}
                            </button>
                        )}

                        {skillGap && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                                    <h4 className="font-semibold text-emerald-300">
                                        Matching skills ({skillGap.matchingSkills.length})
                                    </h4>

                                    {skillGap.matchingSkills.length > 0 ? (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {skillGap.matchingSkills.map((skill) => (
                                                <span
                                                    key={skill.name}
                                                    className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-sm text-emerald-100"
                                                >
                                                    {skill.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-sm text-slate-400">
                                            No matching skills found yet.
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
                                    <h4 className="font-semibold text-amber-300">
                                        Skills to develop ({skillGap.missingSkills.length})
                                    </h4>

                                    {skillGap.missingSkills.length > 0 ? (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {skillGap.missingSkills.map((skill) => (
                                                <span
                                                    key={skill.name}
                                                    className="rounded-full bg-amber-500/15 px-3 py-1.5 text-sm text-amber-100"
                                                >
                                                    {skill.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-sm text-slate-400">
                                            You&apos;ve matched all detected skills!
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {skillGap && skillGap.missingSkills.length > 0 && (
                            <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-5">
                                <h3 className="text-lg font-semibold text-sky-200">
                                    Your personalized learning plan
                                </h3>
                                <p className="mt-2 text-sm text-slate-300">
                                    Focus on these skills to strengthen your fit for this role.
                                </p>
                                <div className="mt-4 space-y-3">
                                    {skillGap.missingSkills.map((skill, index) => (
                                        <div
                                            key={skill.name}
                                            className="rounded-lg border border-slate-700 bg-slate-900/60 p-4"
                                        >
                                            <h4 className="font-medium text-white">
                                                {index + 1}. Learn {skill.name}
                                            </h4>

                                            <p className="mt-1 text-sm text-slate-300">
                                                {getLearningRecommendation(skill.name)}
                                            </p>

                                            {LEARNING_RESOURCES[skill.name] && (
                                                <a
                                                    href={LEARNING_RESOURCES[skill.name].url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-3 inline-block text-sm font-medium text-sky-300 underline decoration-sky-300/40 underline-offset-4 transition hover:text-sky-200"
                                                >
                                                    Explore: {LEARNING_RESOURCES[skill.name].label} ↗
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                        {detectedSkills.length > 0 ? (
                            <details className="rounded-xl border border-indigo-400/20 bg-slate-900/40 p-4">
                                <summary className="cursor-pointer font-medium text-indigo-200 transition hover:text-indigo-100">
                                    Detected skills by category ({detectedSkills.length})
                                </summary>

                                <div className="mt-4 space-y-4">
                                    {(
                                        [
                                            "Languages",
                                            "Frameworks",
                                            "Backend & Data",
                                            "Tools",
                                        ] as const
                                    ).map((category) => {
                                        const categorySkills = detectedSkills.filter(
                                            (skill) => skill.category === category,
                                        );

                                        if (categorySkills.length === 0) {
                                            return null;
                                        }

                                        return (
                                            <div key={category}>
                                                <h4 className="mb-2 text-sm font-medium text-indigo-300">
                                                    {category}
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {categorySkills.map((skill) => (
                                                        <span
                                                            key={skill.name}
                                                            className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-sm text-indigo-100"
                                                        >
                                                            {skill.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </details>
                        ) : (
                            <p className="text-sm leading-6 text-slate-400">
                                No skills from our current catalog were detected. Try including
                                specific technologies such as React, TypeScript, or Node.js.
                            </p>
                        )}

                    </div>
                )}

                <button
                    type="submit"
                    className="w-full rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                    Prepare job analysis
                </button>
            </form>

            {savedAnalyses.length > 0 && (
                <div className="mt-8 border-t border-slate-700 pt-6">
                    <h3 className="text-xl font-semibold text-white">
                        Saved Job Analyses ({savedAnalyses.length})
                    </h3>

                    <div className="mt-4 space-y-3">
                        {savedAnalyses.map((analysis) => (
                            <div
                                key={analysis.id}
                                className="rounded-xl border border-slate-700 bg-slate-950 p-4"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <h4 className="font-semibold text-white">
                                        {analysis.jobTitle}
                                    </h4>

                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-indigo-300">
                                            {analysis.matchPercentage}%
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => handleEditAnalysis(analysis)}
                                            className="rounded-lg border border-indigo-400/30 px-3 py-1.5 text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/10"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteAnalysis(analysis.id)}
                                            className="rounded-lg border border-red-400/30 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                <p className="mt-2 text-sm text-slate-400">
                                    {analysis.matchingSkills.length} matching skills ·{" "}
                                    {analysis.missingSkills.length} skills to develop
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
