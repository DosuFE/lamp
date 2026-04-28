"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/app/services/api";
import { AppMessageModal } from "@/components/AppMessageModal";
import type { MessageVariant } from "@/components/AppMessageModal";
import { OverlayPreloader } from "@/components/OverlayPreloader";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(20, "Password must not exceed 20 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalVariant, setModalVariant] = useState<MessageVariant>("error");

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: values.email.trim(),
          password: values.password.trim(),
        }),
      });
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
    },
    onError: (err: unknown) => {
      setModalMessage(getErrorMessage(err, "Login failed."));
      setModalVariant("error");
      setModalOpen(true);
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <OverlayPreloader open={loginMutation.isPending} label="Signing you in…" />
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

        <form className="space-y-4" onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
          <input
            placeholder="Email"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition focus:border-cyan-400 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            {...register("email")}
          />
          {errors.email ? <p className="mt-1 text-xs text-red-300">{errors.email.message}</p> : null}

          <input
            type="password"
            maxLength={20}
            placeholder="Password"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition focus:border-cyan-400 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            {...register("password")}
          />
          {errors.password ? <p className="mt-1 text-xs text-red-300">{errors.password.message}</p> : null}

          <button
            type="submit"
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 text-base font-semibold text-white shadow-[0_0_40px_rgba(59,130,246,0.35)] transition duration-200 hover:scale-[1.01] hover:shadow-[0_0_55px_rgba(59,130,246,0.45)] focus:outline-none focus:ring-4 focus:ring-cyan-400/30"
          >
            {loginMutation.isPending ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
