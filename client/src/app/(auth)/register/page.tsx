"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/services/api";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    matricNo: "",
    // faculty: "",
    department: "",
    password: "",
  });

 const register = async () => {
  try {
    const res = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        matricNo: form.matricNo, // ✅ FIXED
        department: form.department,
        role: "student", // ✅ REQUIRED
      }),
    });

    console.log("REGISTER SUCCESS:", res);

    alert("Account created successfully");
    router.push("/login");
  } catch (err: any) {
    console.error("REGISTER ERROR:", err);
    alert(err.message);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 px-6 py-8 shadow-[0_30px_90px_rgba(139,92,246,0.22)] backdrop-blur-xl sm:px-10 sm:py-10">
        <div className="absolute inset-x-16 top-0 h-1 rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-500 to-sky-400 opacity-90 blur-2xl" />

        <h2 className="relative text-3xl sm:text-4xl font-semibold text-white text-center tracking-tight mb-8">
          Create Account
        </h2>

        <div className="space-y-4">
          <input
            placeholder="Full Name"
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white 
            placeholder:text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition 
            focus:border-violet-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />

          <input
            placeholder="Email"
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white 
            placeholder:text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition 
            focus:border-violet-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <input
            placeholder="Matric Number"
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white 
            placeholder:text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition 
            focus:border-violet-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            onChange={(e) => setForm({ ...form, matricNo: e.target.value })}
            required
          />

          <input
            placeholder="Department"
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white 
            placeholder:text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition 
            focus:border-violet-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white 
            placeholder:text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition 
            focus:border-violet-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <button
          onClick={register}
          className="mt-8 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 
          py-3 text-base font-semibold text-white shadow-[0_0_40px_rgba(168,85,247,0.35)] 
          transition duration-200 hover:scale-[1.01] hover:shadow-[0_0_55px_rgba(168,85,247,0.45)] 
          focus:outline-none focus:ring-4 focus:ring-violet-400/30 cursor-pointer"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}