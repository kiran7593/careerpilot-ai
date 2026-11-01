"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import type { SavedAnalysis } from "@/lib/jobAnalyzer";

type ProgressChartProps = {
    analyses: SavedAnalysis[];
};

export default function ProgressChart({ analyses }: ProgressChartProps) {
    const chartData = [...analyses]
        .sort(
            (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
        )
        .map((analysis, index) => ({
            name: analysis.jobTitle || `Analysis ${index + 1}`,
            date: new Date(analysis.createdAt).toLocaleDateString(),
            matchPercentage: analysis.matchPercentage,
        }));

    if (chartData.length === 0) {
        return (
            <p className="text-sm text-slate-400">
                Save some job analyses to see your progress.
            </p>
        );
    }

    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

                    <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        tick={{ fontSize: 12 }}
                    />

                    <YAxis
                        domain={[0, 100]}
                        stroke="#94a3b8"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value: number) => `${value}%`}
                    />

                    <Tooltip
                        formatter={(value) => [`${value}%`, "Skill match"]}
                        labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.name ?? ""
                        }
                    />

                    <Line
                        type="monotone"
                        dataKey="matchPercentage"
                        stroke="#818cf8"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#818cf8" }}
                        activeDot={{ r: 7 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}