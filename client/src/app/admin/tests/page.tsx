"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/app/services/api";

export default function AdminTestsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [courseId, setCourseId] = useState("");
  const [tests, setTests] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("30");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("role") !== "admin") {
      router.replace("/dashboard");
      return;
    }
    setAuthorized(true);
    (async () => {
      try {
        const list = await api("/courses");
        setCourses(list);
      } catch {
        setCourses([]);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!courseId) {
      setTests([]);
      return;
    }
    (async () => {
      try {
        const list = await api(`/tests/course/${courseId}`);
        setTests(list);
      } catch {
        setTests([]);
      }
    })();
  }, [courseId]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p>Checking access...</p>
      </div>
    );
  }

  const createTest = async () => {
    if (!courseId || !title.trim()) {
      alert("Select a course and enter a test title.");
      return;
    }
    const minutes = Number(duration);
    if (!Number.isFinite(minutes) || minutes < 1) {
      alert("Duration must be at least 1 minute.");
      return;
    }
    try {
      setLoading(true);
      await api("/tests", {
        method: "POST",
        body: JSON.stringify({
          courseId: Number(courseId),
          title: title.trim(),
          duration: minutes,
        }),
      });
      setTitle("");
      const list = await api(`/tests/course/${courseId}`);
      setTests(list);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Admin — CBT tests</h1>
          <Link
            href="/admin/courses"
            className="text-sm text-cyan-300 hover:underline"
          >
            Back to courses
          </Link>
        </div>

        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
          <label className="block text-sm text-slate-400 mb-2">Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-lg bg-slate-800 p-3 border border-white/10"
          >
            <option value="">Select course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Create test</h2>
          <input
            placeholder="Test title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-slate-800 p-3 border border-white/10"
          />
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg bg-slate-800 p-3 border border-white/10"
            />
          </div>
          <button
            type="button"
            onClick={createTest}
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 py-3 font-semibold hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Create test"}
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
          <h2 className="text-lg font-semibold mb-4">Tests in course</h2>
          {tests.length === 0 ? (
            <p className="text-slate-500 text-sm">
              {courseId
                ? "No tests yet. Create one above."
                : "Pick a course to list tests."}
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
                      {t.duration} min · ID {t.id}
                    </p>
                  </div>
                  <Link
                    href={`/admin/tests/${t.id}`}
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold hover:bg-cyan-500"
                  >
                    Questions
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
