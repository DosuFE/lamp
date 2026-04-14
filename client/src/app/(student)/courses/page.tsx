"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/services/api";
import { useRouter } from "next/navigation";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const router = useRouter(); 

  const fetchCourses = async () => {
    const res = await api("/courses");
    setCourses(res);
  };

  const enroll = async (courseId: number) => {
    await api(`/enrollments/${courseId}`, {
      method: "POST",
    });

    alert("Enrolled successfully!");
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Courses</h1>
        <p className="text-gray-500 text-sm">
          Browse available courses and enroll to start learning.
        </p>
      </div>

      {/* COURSES */}
      <div className="grid md:grid-cols-2 gap-4">
        {courses.map((c: any) => (
          <div
            key={c.id}
            className="border rounded-lg p-4 shadow-sm bg-white"
          >
            <h2 className="text-lg font-medium mb-2">{c.title}</h2>

            <p className="text-sm text-gray-600 mb-4">
              {c.description || "No description available"}
            </p>

            {/* BUTTONS */}
            <div className="flex justify-between">
              {/* ENROLL */}
              <button
                onClick={() => enroll(c.id)}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
              >
                Enroll
              </button>

              {/* VIEW LECTURES */}
              <button
                onClick={() => router.push(`/lectures/${c.id}`)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
              >
                View Lectures
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}