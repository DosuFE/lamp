"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/app/services/api";

export default function ResultsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/results");
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e.message || "Could not load results.");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Your results</h1>
            <p className="text-slate-400 text-sm mt-1">
              Scores from completed CBT attempts.
            </p>
          </div>
          <Link
            href="/tests"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/5"
          >
            Take a test
          </Link>
        </div>

        {error ? (
          <p className="text-red-400">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-slate-500">
            No graded attempts yet. Finish a test to see it here.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Test</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">%</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-900/50">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium">
                      {r.test?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {r.test?.course?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.score} / {r.totalQuestions}
                    </td>
                    <td className="px-4 py-3">{r.percentage}</td>
                    <td className="px-4 py-3 text-emerald-400">{r.grade}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {r.submittedAt
                        ? new Date(r.submittedAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
