"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/app/services/api";

export default function StudentTestsPage() {
  const [enrolled, setEnrolled] = useState<any[]>([]);
  const [courseId, setCourseId] = useState("");
  const [tests, setTests] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const rows = await api("/enrollments/my-courses");
        setEnrolled(rows);
      } catch {
        setEnrolled([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!courseId) {
      setTests([]);
      return;
    }
    (async () => {
      try {
        const rows = await api(`/tests/course/${courseId}`);
        setTests(rows);
      } catch {
        setTests([]);
      }
    })();
  }, [courseId]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold tracking-tight">CBT exams</h1>
          <p className="mt-2 text-slate-400 text-sm">
            Choose a course you are enrolled in, then start a timed test. Device
            location must be on and allowed in the browser before the exam
            begins.
          </p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-white">
          <label className="block text-sm text-slate-400 mb-2">Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-lg bg-slate-800 p-3 border border-white/10"
          >
            <option value="">Select course…</option>
            {enrolled.map((e) => (
              <option key={e.id} value={e.course.id}>
                {e.course.title}
              </option>
            ))}
          </select>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-white">
          <h2 className="text-lg font-semibold mb-4">Available tests</h2>
          {tests.length === 0 ? (
            <p className="text-slate-500 text-sm">
              {courseId
                ? "No tests published for this course yet."
                : "Select a course to see tests."}
            </p>
          ) : (
            <ul className="space-y-3">
              {tests.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-slate-400">
                      Time limit: {t.duration} minutes
                    </p>
                  </div>
                  <Link
                    href={`/tests/${t.id}/take`}
                    className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 text-sm font-semibold"
                  >
                    Start
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
