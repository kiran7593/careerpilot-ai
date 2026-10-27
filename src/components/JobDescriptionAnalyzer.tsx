
"use client";

import { useState } from "react";

export default function JobDescriptionAnalyzer() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    setSuccess(
      "Your job description has been accepted. Analysis will be added in the next step.",
    );
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
