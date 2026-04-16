"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/services/api";

export default function Dashboard() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await api("/enrollments/my-courses");
      setCourses(res);
    };

    fetchCourses();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-wider">
            Welcome to Your Dashboard
          </h1>
          <p className="mt-2 text-slate-400">
            Track your enrolled courses and progress here. Click on a course to access materials and quizzes.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.length === 0 ? (
            <div className="col-span-full text-center text-slate-400">
              <p>You have not enrolled in any courses yet.</p>
            </div>
          ) : (
            courses.map((c: any) => (
              <div
                key={c.id}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-[0_20px_60px_rgba(99,102,241,0.15)] backdrop-blur-sm transition duration-200 hover:scale-[1.02] hover:shadow-[0_25px_80px_rgba(99,102,241,0.25)]"
              >
                <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-violet-500/20 blur-2xl" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {c.course.title}
                {c.course.description && (
                  <p className="text-sm text-slate-400">
                    {c.course.description}
                  </p>
                )}
              </h3>
              {/* <p className="text-sm text-slate-400">
                Course ID: {c.course.id}
              </p> */}
            </div>
          )))}
        </div>
      </div>
    </main>
  );
}