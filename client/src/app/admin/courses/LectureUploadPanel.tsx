 "use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { api } from "@/app/services/api";
import { AppMessageModal } from "@/components/AppMessageModal";
import type { MessageVariant } from "@/components/AppMessageModal";
import { AppConfirmModal } from "@/components/AppConfirmModal";

type Course = {
  id: number;
  title: string;
  department: string;
};

type LectureRow = {
  id: number;
  title: string;
  content?: string | null;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  date: string;
  course: { id: number; title: string };
};

type ModalState = {
  open: boolean;
  title?: string;
  message: string;
  variant: MessageVariant;
};

const createLectureSchema = z
  .object({
    courseId: z.number().int().positive(),
    title: z.string().trim().min(1, "Title is required.").max(500),
    scheduledAt: z.string().min(1, "Schedule date and time is required."),
    notes: z.string().trim().max(500000).optional(),
    videoUrl: z.string().trim().url("Video URL must be valid.").max(2000).optional().or(z.literal("")),
    pdfUrl: z.string().trim().url("PDF URL must be valid.").max(5000).optional().or(z.literal("")),
  })
  .refine((value) => value.notes || value.videoUrl || value.pdfUrl, {
    message:
      "Add notes, a video URL, or a Google Drive PDF link so students have something to use.",
    path: ["notes"],
  });

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function LectureUploadPanel({ courses }: { courses: Course[] }) {
  const [courseId, setCourseId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const [modal, setModal] = useState<ModalState>({
    open: false,
    message: "",
    variant: "info",
  });

  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    id: number | null;
    title: string;
  }>({ open: false, id: null, title: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openModal = (
    message: string,
    variant: MessageVariant = "info",
    title?: string,
  ) => setModal({ open: true, message, variant, title });

  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const lecturesQuery = useQuery({
    queryKey: ["lectures", "admin"],
    queryFn: async () => {
      const data = await api("/lectures");
      return Array.isArray(data) ? (data as LectureRow[]) : [];
    },
  });

  const allLectures = lecturesQuery.data ?? [];
  const listLoading = lecturesQuery.isLoading || lecturesQuery.isFetching;

  const lecturesForCourse = allLectures.filter(
    (l) => l.course?.id === courseId,
  );

  const resetForm = () => {
    setTitle("");
    setScheduledAt("");
    setVideoUrl("");
    setPdfUrl("");
    setNotes("");
  };

  const publishLecture = async () => {
    if (courseId === "") return openModal("Choose a course first.", "error", "Publish lecture");

    const parsed = createLectureSchema.safeParse({
      courseId,
      title,
      scheduledAt,
      notes,
      videoUrl,
      pdfUrl,
    });

    if (!parsed.success) {
      const firstMessage = parsed.error.issues[0]?.message ?? "Invalid lecture details.";
      openModal(firstMessage, "error", "Publish lecture");
      return;
    }

    const payload = parsed.data;

    try {
      await api("/lectures", {
        method: "POST",
        body: JSON.stringify({
          courseId: payload.courseId,
          title: payload.title.trim(),
          content: payload.notes?.trim() || undefined,
          videoUrl: payload.videoUrl?.trim() || undefined,
          pdfUrl: payload.pdfUrl?.trim() || undefined,
          date: new Date(payload.scheduledAt).toISOString(),
        }),
      });

      openModal("Lecture published.", "success", "Publish lecture");
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["lectures", "admin"] });
    } catch (err: unknown) {
      openModal(getErrorMessage(err, "Could not publish lecture."), "error", "Publish lecture");
    }
  };

  const publishMutation = useMutation({
    mutationFn: publishLecture,
  });

  const requestDelete = (row: LectureRow) => {
    setConfirmDelete({ open: true, id: row.id, title: row.title });
  };

  const confirmDeleteLecture = async () => {
    if (confirmDelete.id == null) return;
    try {
      setDeleteLoading(true);
      await api(`/lectures/${confirmDelete.id}`, { method: "DELETE" });
      setConfirmDelete({ open: false, id: null, title: "" });
      await queryClient.invalidateQueries({ queryKey: ["lectures", "admin"] });
    } catch (err: unknown) {
      openModal(getErrorMessage(err, "Delete failed."), "error", "Delete lecture");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (courses.length === 0) {
    return (
      <p className="text-slate-400">
        Create a course first, then you can publish lectures for it.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 sm:p-8">
      <AppMessageModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        onClose={closeModal}
      />
      <AppConfirmModal
        open={confirmDelete.open}
        title="Delete lecture"
        message={
          confirmDelete.title
            ? `Remove “${confirmDelete.title}”? Students will lose access.`
            : "Remove this lecture?"
        }
        danger
        loading={deleteLoading}
        confirmLabel="Delete"
        onConfirm={confirmDeleteLecture}
        onCancel={() =>
          !deleteLoading &&
          setConfirmDelete({ open: false, id: null, title: "" })
        }
      />

      <div className="mb-8 flex flex-col gap-2 border-b border-slate-700 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Lectures
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Add a video link (YouTube, Vimeo, or a direct file), typed notes,
            and/or a Google Drive PDF.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Course
            </label>
            <select
              value={courseId === "" ? "" : String(courseId)}
              onChange={(e) => {
                const v = e.target.value;
                setCourseId(v === "" ? "" : Number(v));
              }}
              className="w-full rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
            >
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} — {c.department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Lecture title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 4 — Linear transformations"
              className="w-full rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Scheduled date & time
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Video URL (optional)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="YouTube, Vimeo, or direct .mp4 / .webm link"
              className="w-full rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Google Drive PDF Link (optional)
            </label>
            <p className="mb-2 text-xs text-yellow-300">
              Paste a Google Drive PDF link. <b>Set sharing to &quot;Anyone with the
              link can view&quot;</b> in Google Drive, or students will get access
              denied.
            </p>
            <input
              type="url"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
              className="w-full rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Outline, reading, or transcript…"
              rows={6}
              className="w-full resize-y rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
            />
          </div>

          <button
            type="button"
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending || listLoading}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishMutation.isPending ? "Publishing…" : "Publish lecture"}
          </button>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Published for this course
            </h3>
            {courseId !== "" && (
              <span className="text-xs text-slate-500">
                {lecturesForCourse.length} lecture
                {lecturesForCourse.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {courseId === "" ? (
            <p className="rounded-xl border border-dashed border-slate-600 bg-slate-800/40 p-6 text-center text-sm text-slate-500">
              Select a course to see its lectures and manage them.
            </p>
          ) : listLoading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Loading lectures…
            </p>
          ) : lecturesForCourse.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-600 bg-slate-800/40 p-6 text-center text-sm text-slate-500">
              No lectures yet for this course.
            </p>
          ) : (
            <ul className="max-h-[min(28rem,70vh)] space-y-2 overflow-y-auto pr-1">
              {lecturesForCourse
                .slice()
                .sort(
                  (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
                )
                .map((lec) => (
                  <li
                    key={lec.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-700/80 bg-slate-800/50 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">
                        {lec.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(lec.date).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <p className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                        {lec.videoUrl ? (
                          <span className="rounded bg-slate-700/80 px-2 py-0.5">
                            Video
                          </span>
                        ) : null}
                        {lec.content ? (
                          <span className="rounded bg-slate-700/80 px-2 py-0.5">
                            Notes
                          </span>
                        ) : null}
                        {lec.pdfUrl ? (
                          <span className="rounded bg-slate-700/80 px-2 py-0.5">
                            PDF
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => requestDelete(lec)}
                      className="shrink-0 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-900/60"
                    >
                      Delete
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}