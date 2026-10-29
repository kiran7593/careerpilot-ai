"use client";

import { useState } from "react";
import {
    analyzeJobDescription,
    compareSkills,
    type SkillGapResult,
    type SkillMatch,
} from "@/lib/jobAnalyzer";

export default function JobDescriptionAnalyzer() {
    const [jobTitle, setJobTitle] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [userSkills, setUserSkills] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [detectedSkills, setDetectedSkills] = useState<SkillMatch[]>([]);
    const [skillGap, setSkillGap] = useState<SkillGapResult | null>(null);

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
        setSkillGap(compareSkills(skills, userSkills));

        setSuccess("Job description analyzed successfully.");
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

                        {detectedSkills.length > 0 ? (
                            <div className="space-y-4">
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
        </section>
    );
}
