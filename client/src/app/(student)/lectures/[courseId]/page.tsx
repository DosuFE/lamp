"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/services/api";
import { useParams } from "next/navigation";
import { AppMessageModal } from "@/components/AppMessageModal";
import { OverlayPreloader } from "@/components/OverlayPreloader";
import {
  LecturePdfDownload,
  LectureVideoPlayer,
} from "@/components/LectureAssets";

export default function LecturesPage() {
  const { courseId } = useParams();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchLectures = async () => {
    setLoading(true);
    try {
      const res = await api(`/lectures/course/${courseId}`);
      setLectures(res);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Access was denied or lectures could not be loaded.",
      );
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) void fetchLectures();
  }, [courseId]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <OverlayPreloader open={loading} label="Loading lectures…" />
      <AppMessageModal
        open={errorOpen}
        title="Lectures"
        message={errorMessage}
        variant="error"
        onClose={() => setErrorOpen(false)}
      />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Course Lectures
          </h1>
          <p className="mt-2 text-slate-400">
            Watch videos, read notes, and download PDFs for this course
          </p>
        </div>

        {lectures.length === 0 ? (
          <div className="text-center text-slate-400">
            No lectures available yet
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lectures.map((lec: any) => (
              <div
                key={lec.id}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-[0_20px_60px_rgba(99,102,241,0.15)] backdrop-blur-sm transition duration-200 hover:scale-[1.02] hover:shadow-[0_25px_80px_rgba(99,102,241,0.25)]"
              >
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-violet-500/20 blur-2xl" />
                <h2 className="mb-4 text-lg font-semibold text-white">
                  {lec.title}
                </h2>

                {lec.videoUrl ? (
                  <LectureVideoPlayer videoUrl={lec.videoUrl} title={lec.title} />
                ) : null}

                {lec.pdfUrl ? (
                  <LecturePdfDownload
                    pdfUrl={lec.pdfUrl}
                    pdfFileName={lec.pdfFileName}
                  />
                ) : null}

                {lec.content ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
                    {lec.content}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
