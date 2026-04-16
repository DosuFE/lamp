"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/services/api";
import { useParams, useRouter } from "next/navigation";

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

    fetchLectures();
  }, [courseId]);

  // 🔄 LOADING UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p>Loading lectures...</p>
      </div>
    );
  }

  // ❌ ERROR UI
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <p className="mb-4 text-red-400">{error}</p>

        <button
          onClick={() => router.push("/courses")}
          className="bg-purple-600 px-4 py-2 rounded"
        >
          Go to Courses
        </button>
      </div>
    );
  }

  // ⚠️ EMPTY STATE
  if (lectures.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <h2 className="text-xl font-semibold mb-2">No Lectures Yet</h2>
        <p className="text-gray-400">
          Lectures for this course have not been uploaded.
        </p>
      </div>
    );
  }

  // ✅ SUCCESS UI
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Course Lectures</h1>

      <div className="grid gap-4">
        {lectures.map((lec: any) => (
          <div
            key={lec.id}
            className="bg-slate-900 p-4 rounded-lg border border-white/10"
          >
            <h2 className="text-lg font-semibold">{lec.title}</h2>
            <p className="text-sm text-gray-400 mb-2">
              {lec.content || "No content"}
            </p>

            {lec.videoUrl && (
              <video
                src={lec.videoUrl}
                controls
                className="w-full mt-3 rounded"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}