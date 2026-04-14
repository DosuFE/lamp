"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/85 px-6 py-10 shadow-[0_45px_120px_rgba(99,102,241,0.25)] backdrop-blur-xl sm:px-10 sm:py-12">
        <div className="absolute -left-12 top-8 h-28 w-28 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -right-12 bottom-8 h-28 w-28 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative text-center text-white">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80 mb-3">
            Learning & Assessment Management Portal
          </p>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4">
            LAMP
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-300 leading-7">
            A polished student portal for course progress, quizzes, and secure access. Get started with a glowing login experience.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push("/login")}
            className="rounded-3xl bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-4 text-sm 
            font-semibold text-white shadow-[0_0_40px_rgba(59,130,246,0.35)] transition duration-200 
            hover:scale-[1.01] hover:shadow-[0_0_55px_rgba(59,130,246,0.45)] focus:outline-none 
            focus:ring-4 focus:ring-cyan-400/30 cursor-pointer"
          >
            Login
          </button>

          <button
            onClick={() => router.push("/register")}
            className="rounded-3xl border border-white/15 bg-white/5 px-6 py-4 text-sm 
            font-semibold text-white transition duration-200 hover:border-cyan-400/40 
            hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-cyan-400/20 cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}