"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { SavedAnalysis } from "@/lib/jobAnalyzer";

type SkillStatus = "Not Started" | "In Progress" | "Completed";

type RoadmapSkill = {
    name: string;
    status: SkillStatus;
    jobCount: number;
};

type SkillRoadmapProps = {
    analyses: SavedAnalysis[];
};

function getSkillStatusesSnapshot() {
    return localStorage.getItem("careerpilot-skill-statuses") ?? "{}";
}

function getServerSkillStatusesSnapshot() {
    return "{}";
}

function subscribeToSkillStatuses(callback: () => void) {
    window.addEventListener("storage", callback);
    window.addEventListener("careerpilot-skill-statuses-changed", callback);

    return () => {
        window.removeEventListener("storage", callback);
        window.removeEventListener("careerpilot-skill-statuses-changed", callback);
    };
}

export default function SkillRoadmap({ analyses }: SkillRoadmapProps) {
    const storedStatuses = useSyncExternalStore(
        subscribeToSkillStatuses,
        getSkillStatusesSnapshot,
        getServerSkillStatusesSnapshot,
    );

    const skillStatuses = useMemo(() => {
        try {
            return JSON.parse(storedStatuses) as Record<string, SkillStatus>;
        } catch {
            return {};
        }
    }, [storedStatuses]);

    const skills = useMemo(() => {
        const skillCounts = new Map<string, number>();

        analyses.forEach((analysis) => {
            analysis.missingSkills.forEach((skill) => {
                const currentCount = skillCounts.get(skill.name) ?? 0;
                skillCounts.set(skill.name, currentCount + 1);
            });
        });

        const roadmapSkills: RoadmapSkill[] = Array.from(
            skillCounts,
            ([name, jobCount]) => ({
                name,
                status: skillStatuses[name] ?? "Not Started",
                jobCount,
            }),
        );

        return roadmapSkills.sort((a, b) => b.jobCount - a.jobCount);
    }, [analyses, skillStatuses]);

    const totalSkills = skills.length;

    const completedSkills = skills.filter(
        (skill) => skill.status === "Completed",
    ).length;

    const inProgressSkills = skills.filter(
        (skill) => skill.status === "In Progress",
    ).length;

    const notStartedSkills = skills.filter(
        (skill) => skill.status === "Not Started",
    ).length;

    const completionPercentage =
        totalSkills === 0
            ? 0
            : Math.round((completedSkills / totalSkills) * 100);

    return (
        <section className="mt-10 rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-2xl font-semibold text-white">
                Skill Development Roadmap
            </h2>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-lg bg-slate-800 p-4">
                    <p className="text-sm text-slate-400">Total Skills</p>
                    <p className="mt-1 text-2xl font-bold text-white">{totalSkills}</p>
                </div>

                <div className="rounded-lg bg-slate-800 p-4">
                    <p className="text-sm text-slate-400">Not Started</p>
                    <p className="mt-1 text-2xl font-bold text-white">{notStartedSkills}</p>
                </div>

                <div className="rounded-lg bg-slate-800 p-4">
                    <p className="text-sm text-slate-400">In Progress</p>
                    <p className="mt-1 text-2xl font-bold text-white">{inProgressSkills}</p>
                </div>

                <div className="rounded-lg bg-slate-800 p-4">
                    <p className="text-sm text-slate-400">Completed</p>
                    <p className="mt-1 text-2xl font-bold text-white">{completedSkills}</p>
                </div>
            </div>

            <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-300">Overall Completion</span>
                    <span className="font-semibold text-white">
                        {completionPercentage}%
                    </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-700">
                    <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
            </div>

            <p className="mt-2 text-sm text-slate-400">
                Track your progress toward the skills employers are looking for.
            </p>

            <div className="mt-6 space-y-3">
                {skills.length === 0 ? (
                    <p className="text-sm text-slate-400">
                        Save some job analyses with missing skills to build your roadmap.
                    </p>
                ) : (
                    skills.map((skill) => (
                        <div
                            key={skill.name}
                            className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 bg-slate-950 p-4"
                        >
                            <div>
                                <h3 className="font-medium text-white">
                                    {skill.name}
                                </h3>
                                <p className="mt-1 text-xs text-slate-400">
                                    Appears in {skill.jobCount} saved{" "}
                                    {skill.jobCount === 1 ? "job" : "jobs"}
                                </p>
                            </div>

                            <select
                                value={skill.status}
                                onChange={(event) => {
                                    const newStatus = event.target.value as SkillStatus;

                                    const updatedStatuses = {
                                        ...skillStatuses,
                                        [skill.name]: newStatus,
                                    };

                                    localStorage.setItem(
                                        "careerpilot-skill-statuses",
                                        JSON.stringify(updatedStatuses),
                                    );

                                    window.dispatchEvent(
                                        new Event("careerpilot-skill-statuses-changed"),
                                    );
                                }}
                                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                            >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}