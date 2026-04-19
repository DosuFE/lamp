"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/services/api";
import { AppMessageModal } from "@/components/AppMessageModal";
import type { MessageVariant } from "@/components/AppMessageModal";
import { OverlayPreloader } from "@/components/OverlayPreloader";

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

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [lectureTitle, setLectureTitle] = useState("");
  const [lectureContent, setLectureContent] = useState("");
  const [lectureDate, setLectureDate] = useState("");
  const [lectureLoading, setLectureLoading] = useState(false);

  const [modal, setModal] = useState<ModalState>({
    open: false,
    message: "",
    variant: "info",
  });

  const openModal = (message: string, variant: MessageVariant = "info", title?: string) => {
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

  const blocking =
    !authorized || coursesLoading || loading || lectureLoading;
  const blockingLabel = !authorized
    ? "Checking access…"
    : coursesLoading
      ? "Loading courses…"
      : loading
        ? "Creating course…"
        : lectureLoading
          ? "Uploading lecture…"
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

  const createLecture = async () => {
    if (!selectedCourseId) {
      openModal("Please select a course by editing its lecture fields.", "error", "Upload lecture");
      return;
    }

    if (!lectureTitle) {
      openModal("Lecture title is required.", "error", "Upload lecture");
      return;
    }

    if (!lectureContent) {
      openModal("Lecture content is required.", "error", "Upload lecture");
      return;
    }

    if (!lectureDate) {
      openModal("Lecture date is required.", "error", "Upload lecture");
      return;
    }

    try {
      setLectureLoading(true);

      await api("/lectures", {
        method: "POST",
        body: JSON.stringify({
          courseId: selectedCourseId,
          title: lectureTitle,
          content: lectureContent,
          date: new Date(lectureDate),
        }),
      });

      openModal("Lecture uploaded successfully.", "success", "Upload lecture");
      setLectureTitle("");
      setLectureContent("");
      setLectureDate("");
      setSelectedCourseId(null);
    } catch (err: any) {
      openModal(err.message || "Upload failed.", "error", "Upload lecture");
    } finally {
      setLectureLoading(false);
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

      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-900 p-8 rounded-2xl mb-8">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Admin - Create Course
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Course Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded bg-slate-800"
            />

            <input
              type="text"
              placeholder="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-3 rounded bg-slate-800"
            />
          </div>

          <textarea
            placeholder="Course Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mb-4 p-3 rounded bg-slate-800"
            rows={3}
          />

          <button
            type="button"
            onClick={createCourse}
            disabled={loading || coursesLoading}
            className="w-full bg-purple-600 py-3 rounded cursor-pointer hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating…" : "Create Course"}
          </button>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl">
          <h2 className="text-xl font-bold mb-6">Manage Courses & Upload Lectures</h2>

          {courses.length === 0 ? (
            <p className="text-slate-400">No courses created yet.</p>
          ) : (
            <div className="space-y-6">
              {courses.map((course) => (
                <div key={course.id} className="border border-slate-700 rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-purple-400">{course.title}</h3>
                    <p className="text-slate-400">{course.department}</p>
                    {course.description && (
                      <p className="text-slate-300 mt-2">{course.description}</p>
                    )}
                  </div>

                  <div className="border-t border-slate-700 pt-4">
                    <h4 className="text-md font-medium mb-3">Upload Lecture</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Lecture Title"
                        value={selectedCourseId === course.id ? lectureTitle : ""}
                        onChange={(e) => {
                          setLectureTitle(e.target.value);
                          setSelectedCourseId(course.id);
                        }}
                        className="w-full p-3 rounded bg-slate-800"
                      />

                      <input
                        type="datetime-local"
                        value={selectedCourseId === course.id ? lectureDate : ""}
                        onChange={(e) => {
                          setLectureDate(e.target.value);
                          setSelectedCourseId(course.id);
                        }}
                        className="w-full p-3 rounded bg-slate-800"
                      />
                    </div>

                    <textarea
                      placeholder="Lecture Content"
                      value={selectedCourseId === course.id ? lectureContent : ""}
                      onChange={(e) => {
                        setLectureContent(e.target.value);
                        setSelectedCourseId(course.id);
                      }}
                      className="w-full mb-4 p-3 rounded bg-slate-800"
                      rows={4}
                    />

                    <button
                      type="button"
                      onClick={createLecture}
                      disabled={selectedCourseId !== course.id || lectureLoading || coursesLoading}
                      className="bg-green-600 py-2 px-4 rounded cursor-pointer hover:bg-green-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                      {lectureLoading ? "Uploading…" : "Upload Lecture"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
