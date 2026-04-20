"use client";

import { getApiBase } from "@/app/services/api";

export function resolvePublicAssetUrl(url: string) {
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  const base = getApiBase();
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

export function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be" && u.pathname.length > 1) {
      const id = u.pathname.slice(1).split("/")[0]?.split("?")[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    if (host === "m.youtube.com" || host.endsWith("youtube.com")) {
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/").filter(Boolean)[1]?.split("?")[0];
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      if (u.pathname.startsWith("/embed/")) {
        return url.trim();
      }
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function vimeoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (!u.hostname.toLowerCase().includes("vimeo.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    let id = "";
    if (parts[0] === "video") {
      id = parts[1] || "";
    } else {
      id = parts[parts.length - 1] || parts[0] || "";
    }
    id = id.split("?")[0];
    if (id && /^\d+$/.test(id)) {
      return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function isProbablyDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogv|ogg)(\?.*)?$/i.test(url.trim()) || url.trim().startsWith("blob:");
}

export function LectureVideoPlayer({
  videoUrl,
  title,
}: {
  videoUrl: string;
  title: string;
}) {
  const trimmed = videoUrl.trim();
  const yt = youtubeEmbedUrl(trimmed);
  const vm = vimeoEmbedUrl(trimmed);
  const direct = isProbablyDirectVideoUrl(trimmed);

  return (
    <div className="mb-4 space-y-2">
      {yt ? (
        <iframe
          title={title}
          src={yt}
          className="aspect-video w-full rounded-lg border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : vm ? (
        <iframe
          title={title}
          src={vm}
          className="aspect-video w-full rounded-lg border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : direct ? (
        <video controls className="w-full rounded-lg" src={trimmed} />
      ) : (
        <div className="rounded-lg border border-amber-500/35 bg-amber-950/25 p-4">
          <p className="mb-3 text-sm leading-relaxed text-amber-50/90">
            This link cannot be played inside the app (for example some Google
            Drive or Dropbox links). Use the button below to watch it in your
            browser.
          </p>
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Open video
          </a>
        </div>
      )}
      {(yt || vm || direct) && (
        <a
          href={trimmed}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-cyan-400 underline-offset-2 hover:underline"
        >
          Open video in new tab
        </a>
      )}
    </div>
  );
}

export function LecturePdfDownload({
  pdfUrl,
  pdfFileName,
}: {
  pdfUrl: string;
  pdfFileName?: string | null;
}) {
  const href = resolvePublicAssetUrl(pdfUrl);
  const raw = (pdfFileName && pdfFileName.trim()) || "lecture-material.pdf";
  const downloadName = raw.toLowerCase().endsWith(".pdf") ? raw : `${raw}.pdf`;

  return (
    <a
      href={href}
      download={downloadName}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-4 inline-flex items-center rounded-xl border border-red-500/40 bg-red-950/35 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-900/45"
    >
      Download PDF
    </a>
  );
}
