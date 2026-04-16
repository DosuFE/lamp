"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/services/api";

export default function AdminCourses() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 PROTECT PAGE
  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "admin") {
      router.replace("/dashboard");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  // ⛔ Prevent rendering before check
  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p>Checking access...</p>
      </div>
    );
  }

  // ✅ CREATE COURSE
  const createCourse = async () => {
    if (!title) {
      alert("Title is required");
      return;
    }

    try {
      setLoading(true);

      await api("/courses", {
        method: "POST",
        body: JSON.stringify({ title, description }),
      });

      alert("Course created!");

      setTitle("");
      setDescription("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-slate-900 p-8 rounded-2xl text-white">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Admin - Create Course
        </h1>

        <input
          type="text"
          placeholder="Course Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-slate-800"
        />

        <textarea
          placeholder="Course Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-slate-800"
        />

        <button
          onClick={createCourse}
          className="w-full bg-purple-600 py-3 rounded"
        >
          {loading ? "Creating..." : "Create Course"}
        </button>
      </div>
    </div>
  );
}