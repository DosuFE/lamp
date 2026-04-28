"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/services/api";
import { useParams, useRouter } from "next/navigation";
import {
  LectureVideoPlayer,
} from "@/components/LectureAssets";

export default function LecturesPage() {
  const { id } = useParams();
  const router = useRouter();

  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const courseId = Number(id);

  useEffect(() => {
    if (!courseId) {
      setError("No course selected");
      setLoading(false);
      return;
    }

    const fetchLectures = async () => {
      try {
        const data = await api(`/lectures/course/${courseId}`);
        setLectures(data);
      } catch (err: any) {
        console.error(err);

        if (err.message.includes("not enrolled")) {
          setError("You are not enrolled in this course");
        } else {
          setError("Failed to load lectures");
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchLectures();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p>Loading lectures...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
        <p className="mb-4 text-red-400">{error}</p>

        <button
          type="button"
          onClick={() => router.push("/courses")}
          className="rounded bg-purple-600 px-4 py-2"
        >
          Go to Courses
        </button>
      </div>
    );
  }

  if (lectures.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
        <h2 className="mb-2 text-xl font-semibold">No Lectures Yet</h2>
        <p className="text-gray-400">
          Lectures for this course have not been uploaded.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="mb-6 text-2xl font-bold">Course Lectures</h1>

      <div className="grid gap-4">
        {lectures.map((lec: any) => (
          <div
            key={lec.id}
            className="rounded-lg border border-white/10 bg-slate-900 p-4"
          >
            <h2 className="text-lg font-semibold">{lec.title}</h2>

            {lec.videoUrl ? (
              <LectureVideoPlayer videoUrl={lec.videoUrl} title={lec.title} />
            ) : null}

            {lec.pdfUrl ? (
              <a
                href={lec.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 inline-block text-sm font-semibold text-cyan-400 
                underline-offset-2 hover:underline"
              >
                Download PDF
              </a>
            ) : null}

            {lec.content ? (
              <p className="mb-2 whitespace-pre-wrap text-sm text-gray-400">
                {lec.content}
              </p>
            ) : null}

          </div>
        ))}
      </div>
    </div>
  );
}