"use client";

import Link from "next/link";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-6">LAMP</h2>

        <nav className="space-y-3">
          <Link href="/dashboard" className="block hover:text-purple-300">
            Dashboard
          </Link>

          <Link href="/courses" className="block hover:text-purple-300">
            Courses
          </Link>

          <Link href="/lectures/1" className="block hover:text-purple-300">
            Lectures
          </Link>

          <Link href="/results" className="block hover:text-purple-300">
            Results
          </Link>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* TOP BAR */}
        <header className="bg-purple-600 text-white p-4 flex justify-between">
          <span>LAMP</span>
          <span>Student</span>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 bg-gray-100">{children}</main>
      </div>
    </div>
  );
}