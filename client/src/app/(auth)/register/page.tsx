"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/services/api";
import { AppMessageModal } from "@/components/AppMessageModal";
import type { MessageVariant } from "@/components/AppMessageModal";
import { OverlayPreloader } from "@/components/OverlayPreloader";

const ALLOWED_EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isAllowedEmail(email: string) {
  const e = normalizeEmail(email);
  const at = e.lastIndexOf("@");
  if (at <= 0) return false;
  const domain = e.slice(at + 1);
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

function passwordMeetsPolicy(pw: string) {
  const v = pw;
  if (v.length < 8) return false;
  if (!/[A-Za-z]/.test(v)) return false;
  if (!/\d/.test(v)) return false;
  return true;
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    matricNo: "",
    // faculty: "",
    department: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalVariant, setModalVariant] = useState<MessageVariant>("info");
  const [postSuccessToLogin, setPostSuccessToLogin] = useState(false);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(normalizeEmail(form.email))) {
      e.email = "Enter a valid email address.";
    } else if (!isAllowedEmail(form.email)) {
      e.email = `Only ${ALLOWED_EMAIL_DOMAINS.join(", ")} emails are allowed.`;
    }

    if (!form.matricNo.trim()) e.matricNo = "Matric number is required.";
    else if (!/^\d+$/.test(form.matricNo.trim())) e.matricNo = "Matric number must be digits only.";

    if (!form.department.trim()) e.department = "Department is required.";

    if (!form.password) e.password = "Password is required.";
    else if (!passwordMeetsPolicy(form.password)) {
      e.password = "Password must be 8+ characters and include at least 1 letter and 1 number.";
    }

    if (!form.confirmPassword) e.confirmPassword = "Confirm password is required.";
    else if (form.confirmPassword !== form.password) e.confirmPassword = "Passwords do not match.";

    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const register = async () => {
    try {
      setTouched({
        fullName: true,
        email: true,
        matricNo: true,
        department: true,
        password: true,
        confirmPassword: true,
      });

      if (!isValid) {
        setModalTitle("Fix your details");
        setModalMessage("Please fill all required fields with valid details.");
        setModalVariant("error");
        setPostSuccessToLogin(false);
        setModalOpen(true);
        return;
      }

      setLoading(true);
      const res = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: normalizeEmail(form.email),
          password: form.password,
          matricNo: Number(form.matricNo),
          department: form.department.trim(),
          role: "student",
        }),
      });

      console.log("REGISTER SUCCESS:", res);

      setModalTitle("Account created");
      setModalMessage("Your account was created successfully. You can sign in now.");
      setModalVariant("success");
      setPostSuccessToLogin(true);
      setModalOpen(true);
    } catch (err: any) {
      console.error("REGISTER ERROR:", err);
      setModalTitle("Registration failed");
      setModalMessage(err.message || "Could not create account.");
      setModalVariant("error");
      setPostSuccessToLogin(false);
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const onCloseModal = () => {
    setModalOpen(false);
    if (postSuccessToLogin) {
      setPostSuccessToLogin(false);
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10">
      <OverlayPreloader open={loading} label="Creating your account…" />
      <AppMessageModal
        open={modalOpen}
        title={modalTitle}
        message={modalMessage}
        variant={modalVariant}
        onClose={onCloseModal}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 px-6 py-8 shadow-[0_30px_90px_rgba(139,92,246,0.22)] backdrop-blur-xl sm:px-10 sm:py-10">
        <div className="absolute inset-x-16 top-0 h-1 rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-500 to-sky-400 opacity-90 blur-2xl" />

        <h2 className="relative text-3xl sm:text-4xl font-semibold text-white text-center tracking-tight mb-8">
          Create Account
        </h2>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={form.fullName}
              placeholder="Full Name"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white 
              placeholder:text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition 
              focus:border-violet-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
              required
            />
            {touched.fullName && errors.fullName ? (
              <p className="mt-1 text-xs text-red-300">{errors.fullName}</p>
            ) : null}
          </div>

          <div>
            <input
              type="email"
              value={form.email}
              placeholder="Email (gmail/yahoo/outlook/hotmail only)"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white 
              placeholder:text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition 
              focus:border-violet-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              required
            />
            {touched.email && errors.email ? (
              <p className="mt-1 text-xs text-red-300">{errors.email}</p>
            ) : null}
          </div>

          <div>
            <input
              type="text"
              inputMode="numeric"
              value={form.matricNo}
              placeholder="Matric Number"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white 
              placeholder:text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition 
              focus:border-violet-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              onChange={(e) => setForm({ ...form, matricNo: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, matricNo: true }))}
              required
            />
            {touched.matricNo && errors.matricNo ? (
              <p className="mt-1 text-xs text-red-300">{errors.matricNo}</p>
            ) : null}
          </div>

          <div>
            <input
              type="text"
              value={form.department}
              placeholder="Department (e.g Mathematics, Computer Science, Chemistry, etc)"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white 
              placeholder:text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition 
              focus:border-violet-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, department: true }))}
              required
            />
            {touched.department && errors.department ? (
              <p className="mt-1 text-xs text-red-300">{errors.department}</p>
            ) : null}
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              placeholder="Password (8+ chars, letter + number)"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 pr-12 text-white 
              placeholder:text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition 
              focus:border-violet-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-2 my-auto inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-200/80 transition hover:bg-white/10 hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 3l18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9.88 5.1A10.65 10.65 0 0112 5c7 0 10 7 10 7a18.1 18.1 0 01-5.1 6.1M6.1 17.9A18.1 18.1 0 012 12s1.32-3.08 4.1-5.1"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </button>
            {touched.password && errors.password ? (
              <p className="mt-1 text-xs text-red-300">{errors.password}</p>
            ) : null}
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              placeholder="Confirm Password"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 pr-12 text-white 
              placeholder:text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition 
              focus:border-violet-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute inset-y-0 right-2 my-auto inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-200/80 transition hover:bg-white/10 hover:text-white"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 3l18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9.88 5.1A10.65 10.65 0 0112 5c7 0 10 7 10 7a18.1 18.1 0 01-5.1 6.1M6.1 17.9A18.1 18.1 0 012 12s1.32-3.08 4.1-5.1"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </button>
            {touched.confirmPassword && errors.confirmPassword ? (
              <p className="mt-1 text-xs text-red-300">{errors.confirmPassword}</p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={register}
          disabled={loading}
          className="mt-8 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 
          py-3 text-base font-semibold text-white shadow-[0_0_40px_rgba(168,85,247,0.35)] 
          transition duration-200 hover:scale-[1.01] hover:shadow-[0_0_55px_rgba(168,85,247,0.45)] 
          focus:outline-none focus:ring-4 focus:ring-violet-400/30 cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </div>
    </div>
  );
}