"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/app/services/api";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await api("/auth/profile");
        setRole(user.role);
        if (user.role) {
          localStorage.setItem("role", user.role);
        } else {
          localStorage.removeItem("role");
        }
      } catch {
        router.replace("/dashboard");
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="flex h-screen bg-slate-950">
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white p-4 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">LAMP</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-4">
          <Link href="/dashboard" className="block py-2 px-3 rounded-lg hover:bg-slate-800 hover:text-cyan-300 transition">
            Dashboard
          </Link>

          <Link href="/courses" className="block py-2 px-3 rounded-lg hover:bg-slate-800 hover:text-cyan-300 transition">
            Courses
          </Link>

          <button
            onClick={() => {
              const courseId = localStorage.getItem("courseId");

              if (!courseId) {
                alert("Please select a course first");
                return;
              }

              router.push(`/lectures/${courseId}`);
              setSidebarOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-800 hover:text-cyan-300 transition"
          >
            Lectures
          </button>

          <Link href="/tests" className="block py-2 px-3 rounded-lg hover:bg-slate-800 hover:text-cyan-300 transition">
            CBT Tests
          </Link>

          <Link href="/results" className="block py-2 px-3 rounded-lg hover:bg-slate-800 hover:text-cyan-300 transition">
            Results
          </Link>

          {role === "admin" && (
            <>
              <p className="text-xs text-slate-400 mt-8 mb-2 uppercase tracking-wide">Admin</p>

              <Link
                href="/admin/courses"
                className="block py-2 px-3 rounded-lg text-yellow-400 hover:bg-slate-800 hover:text-yellow-300 transition"
              >
                Manage Courses
              </Link>
              <Link
                href="/admin/tests"
                className="block py-2 px-3 rounded-lg text-yellow-400 hover:bg-slate-800 hover:text-yellow-300 transition"
              >
                Manage Tests (CBT)
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* OVERLAY for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* TOP BAR */}
        <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white hover:text-slate-300"
          >
            ☰
          </button>
          <span className="text-lg font-semibold">Dashboard</span>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("role");
              localStorage.removeItem("courseId");

              router.replace("/login");
            }}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 bg-slate-950 overflow-auto">{children}</main>
      </div>
    </div>
  );
}