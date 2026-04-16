"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/services/api";
import { useRouter } from "next/navigation";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const router = useRouter(); 

  const fetchData = async () => {
    try {
      const allCourses = await api("/courses");
      const enrolled = await api("/enrollments/my-courses");

      setCourses(allCourses);

      // extract enrolled course IDs
      const ids = enrolled.map((e: any) => e.course.id);
      setMyCourses(ids);
    } catch (err) {
      console.error(err);
    }
  };

  const enroll = async (courseId: number) => {
    try {
      setLoadingId(courseId);

      await api(`/enrollments/${courseId}`, {
        method: "POST",
      });

      setMyCourses((prev) => [...prev, courseId]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 rounded-[2rem] border border-white/10 bg-slate-900/85 px-6 py-8 shadow-[0_45px_120px_rgba(99,102,241,0.22)] backdrop-blur-xl sm:px-10 sm:py-12">
          <div className="mb-6 text-center text-white">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80 mb-3">
              Available Courses
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Choose your next learning path
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-slate-300 leading-7">
              Browse courses you can enroll in today, then jump into lectures as soon as you’re enrolled.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c: any) => {
              const isEnrolled = myCourses.includes(c.id);

              return (
                <div
                  key={c.id}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.38)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(99,102,241,0.30)]"
                >
                  <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-violet-500/20 blur-2xl" />
                  <h2 className="text-xl font-semibold text-white mb-3">{c.title}</h2>
                  <p className="text-sm text-slate-400 mb-6">
                    {c.description || "No description available."}
                  </p>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      onClick={() => enroll(c.id)}
                      disabled={isEnrolled || loadingId === c.id}
                      className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-400/25 ${
                        isEnrolled
                          ? "bg-slate-600"
                          : "bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_30px_rgba(34,197,94,0.24)]"
                      }`}
                    >
                      {loadingId === c.id
                        ? "Enrolling..."
                        : isEnrolled
                        ? "Enrolled"
                        : "Enroll"}
                    </button>

                    {isEnrolled && (
                      <button
                        onClick={() => {
                        localStorage.setItem("courseId", c.id.toString()); // 🔥 store it
                        router.push(`/lectures/${c.id}`);
                      }}
                        className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-violet-500/15"
                      >
                        View Lectures
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}