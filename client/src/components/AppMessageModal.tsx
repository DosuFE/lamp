"use client";

import { useEffect } from "react";

export type MessageVariant = "info" | "success" | "error";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  variant?: MessageVariant;
  onClose: () => void;
};

export function AppMessageModal({
  open,
  title,
  message,
  variant = "info",
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const border =
    variant === "success"
      ? "border-emerald-500/35"
      : variant === "error"
        ? "border-red-500/40"
        : "border-cyan-500/30";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={title ? "app-msg-title" : undefined}
        className={`w-full max-w-md rounded-2xl border bg-slate-900 p-6 shadow-2xl ${border}`}
      >
        {title ? (
          <h2 id="app-msg-title" className="mb-2 text-lg font-semibold text-white">
            {title}
          </h2>
        ) : null}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
        >
          OK
        </button>
      </div>
    </div>
  );
}
