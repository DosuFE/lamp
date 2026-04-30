"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/services/api";
import { AppMessageModal } from "@/components/AppMessageModal";
import type { MessageVariant } from "@/components/AppMessageModal";
import { OverlayPreloader } from "@/components/OverlayPreloader";
import { LectureUploadPanel } from "./LectureUploadPanel";

type Course = {
  id: number;
  title: string;
  department: string;
  description?: string;
};

type ModalState = {
  open: boolean;
  title?: string;
  message: string;
  variant: MessageVariant;
};

export default function AdminCourses() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const [modal, setModal] = useState<ModalState>({
    open: false,
    message: "",
    variant: "info",
  });

  const openModal = (
    message: string,
    variant: MessageVariant = "info",
    title?: string,
  ) => {
    setModal({ open: true, message, variant, title });
  };

  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const data = await api("/courses");
      setCourses(data);
    } catch (err: any) {
      openModal(err.message || "Could not load courses.", "error", "Courses");
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "admin") {
      router.replace("/dashboard");
    } else {
      setAuthorized(true);
      void fetchCourses();
    }
  }, [router, fetchCourses]);

  const blocking = !authorized || coursesLoading || loading;
  const blockingLabel = !authorized
    ? "Checking access…"
    : coursesLoading
      ? "Loading courses…"
      : loading
        ? "Creating course…"
        : undefined;

  const createCourse = async () => {
    if (!title) {
      openModal("Title is required.", "error", "Create course");
      return;
    }

    if (!department) {
      openModal("Department is required.", "error", "Create course");
      return;
    }

    try {
      setLoading(true);

      await api("/courses", {
        method: "POST",
        body: JSON.stringify({ title, department, description }),
      });

      openModal("Course created successfully.", "success", "Create course");
      setTitle("");
      setDepartment("");
      setDescription("");
      void fetchCourses();
    } catch (err: any) {
      openModal(err.message || "Could not create course.", "error", "Create course");
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return <OverlayPreloader open label={blockingLabel} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <OverlayPreloader open={blocking} label={blockingLabel} />
      <AppMessageModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        onClose={closeModal}
      />

      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-2xl bg-slate-900 p-8">
          <h1 className="mb-6 text-center text-2xl font-bold">
            Admin — Create course
          </h1>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Course title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-slate-800 p-3"
            />

            <input
              type="text"
              placeholder="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-lg bg-slate-800 p-3"
            />
          </div>

          <textarea
            placeholder="Course description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mb-4 w-full rounded-lg bg-slate-800 p-3"
            rows={3}
          />

          <button
            type="button"
            onClick={createCourse}
            disabled={loading || coursesLoading}
            className="w-full cursor-pointer rounded-lg bg-purple-600 py-3 transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create course"}
          </button>
        </div>

        <LectureUploadPanel courses={courses} />

        

        <div className="rounded-2xl bg-slate-900 p-8">
          <h2 className="mb-6 text-xl font-bold">All courses</h2>

          {courses.length === 0 ? (
            <p className="text-slate-400">No courses created yet.</p>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-lg border border-slate-700 p-6"
                >
                  <h3 className="text-lg font-semibold text-purple-400">
                    {course.title}
                  </h3>
                  <p className="text-slate-400">{course.department}</p>
                  {course.description ? (
                    <p className="mt-2 text-slate-300">{course.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}