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
  // const [loading, setLoading] = useState(true);

  // 🔐 LOAD USER ROLE
  // useEffect(() => {
  //   const storedRole = localStorage.getItem("role");
  //   setRole(storedRole);
  //   setLoading(false);
  // }, []);

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
  // ⛔ Prevent UI flicker before role loads
  // if (loading) return null;

  return (
    <div className="flex h-screen">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-6">LAMP</h2>

        <nav className="space-y-3">
          {/* DASHBOARD */}
          <Link href="/dashboard" className="block hover:text-purple-300">
            Dashboard
          </Link>

          {/* COURSES */}
          <Link href="/courses" className="block hover:text-purple-300">
            Courses
          </Link>

          {/* LECTURES */}
          <button
            onClick={() => {
              const courseId = localStorage.getItem("courseId");

              if (!courseId) {
                alert("Please select a course first");
                return;
              }

              router.push(`/lectures/${courseId}`);
            }}
            className="w-full text-left hover:text-purple-300 cursor-pointer"
          >
            Lectures
          </button>

          {/* TEST */}
          <Link href="#" className="block hover:text-purple-300">
            Test
          </Link>

          {/* RESULTS */}
          <Link href="/results" className="block hover:text-purple-300">
            Results
          </Link>

          {/* 🔥 ADMIN SECTION */}
          {role === "admin" && (
            <>
              <p className="text-xs text-gray-400 mt-6 mb-2">ADMIN</p>

              <Link
                href="/admin/courses"
                className="block text-yellow-400 hover:text-yellow-300"
              >
                Manage Courses
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* TOP BAR */}
        <header className="bg-purple-600 text-white p-4 flex justify-between">
          <span>Dashboard</span>

          {/* LOGOUT */}
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("role");
              localStorage.removeItem("courseId");

              router.replace("/login");
            }}
            className="bg-purple-700 hover:bg-purple-800 px-3 py-1 rounded transition"
          >
            Logout
          </button>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 bg-gray-100">{children}</main>
      </div>
    </div>
  );
}