"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/app/services/api";

export default function LecturesPage() {
  const { courseId } = useParams();
  const [lectures, setLectures] = useState([]);

  const fetchLectures = async () => {
    try {
      const res = await api(`/lectures/course/${courseId}`);
      setLectures(res);
    } catch (err: any) {
      alert(err.message || "Access denied or error fetching lectures");
    }
  };

  useEffect(() => {
    fetchLectures();
  }, []);

  return (
    <div className="p-6">
      {/* HEADER */}
      <h1 className="text-2xl font-semibold mb-6">
        Course Lectures
      </h1>

      {/* EMPTY STATE */}
      {lectures.length === 0 && (
        <p className="text-gray-500">No lectures available yet.</p>
      )}

      {/* LECTURES LIST */}
      <div className="space-y-4">
        {lectures.map((lecture: any) => (
          <div
            key={lecture.id}
            className="bg-white p-4 rounded shadow"
          >
            <h2 className="text-lg font-semibold">
              {lecture.title}
            </h2>

            <p className="text-sm text-gray-600 mb-3">
              {lecture.description}
            </p>

            {/* VIDEO / LINK */}
            {lecture.videoUrl ? (
              <video
                controls
                className="w-full rounded"
                src={lecture.videoUrl}
              />
            ) : lecture.fileUrl ? (
              <a
                href={lecture.fileUrl}
                target="_blank"
                className="text-blue-600 underline"
              >
                Download Material
              </a>
            ) : (
              <p className="text-gray-400 text-sm">
                No content uploaded
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}