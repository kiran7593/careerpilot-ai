"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-lg font-bold">
            C
          </div>
          <span className="text-xl font-bold tracking-tight">
            CareerPilot<span className="text-indigo-400"> AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-slate-300 sm:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-white">
            How it works
          </a>
        </div>

        <a
          href="#get-started"
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-100"
        >
          Get started
        </a>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-16 lg:grid-cols-2 lg:px-8 lg:pb-32 lg:pt-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-2 text-sm text-indigo-200">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            Your next career move starts here
          </div>

          <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Turn your experience into your{" "}
            <span className="text-indigo-400">next opportunity.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Understand how your skills match a job, discover what you can
            improve, and build a practical plan to get where you want to go.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="#get-started"
              className="rounded-xl bg-indigo-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
            >
              Analyze a job <span aria-hidden="true">→</span>
            </a>
            <a
              href="#features"
              className="rounded-xl border border-slate-700 px-6 py-3.5 font-semibold text-white transition hover:border-slate-500 hover:bg-slate-900"
            >
              Explore features
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
            <span>✓ Evidence-based feedback</span>
            <span>✓ Personalized learning plans</span>
            <span>✓ Your career, your direction</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-5 rounded-3xl bg-indigo-500/10 blur-3xl" />

          <div className="relative rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-indigo-300">
                  CAREER MATCH PREVIEW
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Your next role, mapped out.
                </h2>
              </div>
              <div className="rounded-xl bg-indigo-400/10 p-3 text-xl">
                ✦
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-slate-700 bg-slate-950/70 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800 text-lg">
                  ↗
                </div>
                <div>
                  <p className="font-semibold">Target position</p>
                  <p className="text-sm text-slate-400">
                    Front-End Developer
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="job-description"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Paste a job description to get started
                </label>
                <textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Looking for a developer with React, TypeScript..."
                  rows={4}
                  className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById("get-started")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="mt-4 w-full rounded-lg bg-indigo-500 px-4 py-3 font-semibold transition hover:bg-indigo-400"
              >
                Explore your career fit <span aria-hidden="true">→</span>
              </button>
              <p className="mt-3 text-center text-xs text-slate-500">
                Preview only — matching analysis comes in a later phase.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-700 p-4">
                <p className="text-sm text-slate-400">Skill insights</p>
                <p className="mt-1 font-semibold">Strengths &amp; gaps</p>
              </div>
              <div className="rounded-xl border border-slate-700 p-4">
                <p className="text-sm text-slate-400">Your next step</p>
                <p className="mt-1 font-semibold">A learning roadmap</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-t border-slate-800 bg-slate-900/50 px-6 py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">
              Built for your next step
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              More than a resume checker.
            </h2>
            <p className="mt-4 leading-7 text-slate-300">
              CareerPilot AI is designed to turn career questions into
              practical, actionable next steps.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-700 bg-slate-950 p-6">
              <div className="text-2xl">⌕</div>
              <h3 className="mt-5 text-xl font-semibold">
                Understand your fit
              </h3>
              <p className="mt-3 leading-7 text-slate-400">
                Compare resume evidence with job requirements and identify
                strengths, missing skills, and areas to investigate.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-700 bg-slate-950 p-6">
              <div className="text-2xl">✎</div>
              <h3 className="mt-5 text-xl font-semibold">
                Improve your resume
              </h3>
              <p className="mt-3 leading-7 text-slate-400">
                Get targeted suggestions that make your real experience
                clearer without inventing qualifications or achievements.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-700 bg-slate-950 p-6">
              <div className="text-2xl">↗</div>
              <h3 className="mt-5 text-xl font-semibold">
                Build your next skills
              </h3>
              <p className="mt-3 leading-7 text-slate-400">
                Turn skill gaps into a structured learning roadmap with
                milestones you can work toward.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">
            A clearer path forward
          </p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
            From job description to action plan.
          </h2>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-indigo-300">STEP 01</p>
              <h3 className="mt-3 text-xl font-semibold">
                Share your target role
              </h3>
              <p className="mt-3 leading-7 text-slate-400">
                Start with a job description and your relevant experience.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-300">STEP 02</p>
              <h3 className="mt-3 text-xl font-semibold">
                Explore your match
              </h3>
              <p className="mt-3 leading-7 text-slate-400">
                Review evidence-backed strengths and skills to develop.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-300">STEP 03</p>
              <h3 className="mt-3 text-xl font-semibold">
                Take your next step
              </h3>
              <p className="mt-3 leading-7 text-slate-400">
                Follow tailored recommendations and track your progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="get-started" className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-indigo-400/20 bg-indigo-500/10 px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Your next chapter starts with a plan.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">
            We’re building tools to help you understand your opportunities
            and make your next move with confidence.
          </p>
          <p className="mt-6 text-sm text-indigo-200">
            CareerPilot AI · Your career, your direction.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CareerPilot AI</p>
          <p>Built to turn career goals into practical next steps.</p>
        </div>
      </footer>
    </main>
  );
}