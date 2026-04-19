"use client";

export function OverlayPreloader({
  open,
  label,
}: {
  open: boolean;
  label?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-11 w-11 animate-spin rounded-full border-2 border-white/15 border-t-cyan-400" />
      {label ? (
        <p className="mt-4 max-w-xs text-center text-sm text-white/90">{label}</p>
      ) : null}
    </div>
  );
}
