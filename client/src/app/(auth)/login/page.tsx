"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/services/api";
import { AppMessageModal } from "@/components/AppMessageModal";
import type { MessageVariant } from "@/components/AppMessageModal";
import { OverlayPreloader } from "@/components/OverlayPreloader";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalVariant, setModalVariant] = useState<MessageVariant>("error");

  const login = async () => {
    try {
      setLoading(true);

      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      console.log("LOGIN SUCCESS:", res);

      localStorage.setItem("token", res.access_token);

      try {
        const profile = await api("/auth/profile");
        if (profile?.role) {
          localStorage.setItem("role", profile.role);
        } else {
          localStorage.removeItem("role");
        }
      } catch {
        localStorage.removeItem("role");
      }

      router.replace("/dashboard");
    } catch (err: any) {
      console.error("LOGIN ERROR:", err.message);
      setModalMessage(err.message || "Login failed.");
      setModalVariant("error");
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <OverlayPreloader open={loading} label="Signing you in…" />
      <AppMessageModal
        open={modalOpen}
        title="Login"
        message={modalMessage}
        variant={modalVariant}
        onClose={() => setModalOpen(false)}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/85 px-6 py-8 shadow-[0_35px_120px_rgba(99,102,241,0.28)] backdrop-blur-xl sm:px-10 sm:py-10">
        <div className="absolute -left-10 top-0 h-24 w-24 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -right-10 bottom-8 h-24 w-24 rounded-full bg-fuchsia-500/20 blur-3xl" />

        <h2 className="relative text-3xl sm:text-4xl font-semibold text-white text-center tracking-tight mb-8 uppercase">
          Login
        </h2>

        <div className="space-y-4">
          <input
            placeholder="Email"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition focus:border-cyan-400 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition focus:border-cyan-400 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          onClick={login}
          className="mt-8 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 text-base font-semibold text-white shadow-[0_0_40px_rgba(59,130,246,0.35)] transition duration-200 hover:scale-[1.01] hover:shadow-[0_0_55px_rgba(59,130,246,0.45)] focus:outline-none focus:ring-4 focus:ring-cyan-400/30"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </div>
    </div>
  );
}
