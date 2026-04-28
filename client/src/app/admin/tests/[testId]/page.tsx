"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/app/services/api";
import { AppConfirmModal } from "@/components/AppConfirmModal";
import { AppMessageModal } from "@/components/AppMessageModal";
import type { MessageVariant } from "@/components/AppMessageModal";
import { OverlayPreloader } from "@/components/OverlayPreloader";

export default function AdminTestQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = String(params.testId ?? "");

  const [authorized, setAuthorized] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [question, setQuestion] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correct, setCorrect] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalVariant, setModalVariant] = useState<MessageVariant>("info");

  const showModal = useCallback(
    (title: string, message: string, variant: MessageVariant) => {
      setModalTitle(title);
      setModalMessage(message);
      setModalVariant(variant);
      setModalOpen(true);
    },
    [],
  );

  const load = useCallback(async () => {
    const rows = await api(`/tests/${testId}/with-answers`);
    setQuestions(rows);
  }, [testId]);

  useEffect(() => {
    if (localStorage.getItem("role") !== "admin") {
      router.replace("/dashboard");
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!authorized || !testId) return;
    (async () => {
      setQuestionsLoading(true);
      try {
        await load();
      } catch {
        setQuestions([]);
        showModal("Questions", "Could not load questions for this test.", "error");
      } finally {
        setQuestionsLoading(false);
      }
    })();
  }, [authorized, testId, load, showModal]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <OverlayPreloader open label="Checking access…" />
      </div>
    );
  }

  const optionsFromFields = () => {
    const opts = [optA, optB, optC, optD]
      .map((s) => s.trim())
      .filter(Boolean);
    return opts;
  };

  const addQuestion = async () => {
    const options = optionsFromFields();
    if (!question.trim() || options.length < 2) {
      showModal("Add question", "Enter the question and at least two options.", "error");
      return;
    }
    if (!correct.trim() || !options.includes(correct.trim())) {
      showModal(
        "Add question",
        "Correct answer must exactly match one of the options.",
        "error",
      );
      return;
    }
    try {
      setLoading(true);
      await api("/questions", {
        method: "POST",
        body: JSON.stringify({
          testId: Number(testId),
          question: question.trim(),
          options,
          correctAnswer: correct.trim(),
        }),
      });
      setQuestion("");
      setOptA("");
      setOptB("");
      setOptC("");
      setOptD("");
      setCorrect("");
      await load();
      showModal("Add question", "Question saved.", "success");
    } catch (e: any) {
      showModal("Add question", e.message || "Could not save question.", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId == null) return;
    try {
      setDeleteLoading(true);
      await api(`/questions/${deleteId}`, { method: "DELETE" });
      await load();
      setDeleteId(null);
    } catch (e: any) {
      showModal("Delete question", e.message || "Could not delete.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <OverlayPreloader
        open={questionsLoading || loading || deleteLoading}
        label={
          questionsLoading
            ? "Loading questions…"
            : deleteLoading
              ? "Deleting…"
              : loading
                ? "Saving…"
                : undefined
        }
      />
      <AppMessageModal
        open={modalOpen}
        title={modalTitle}
        message={modalMessage}
        variant={modalVariant}
        onClose={() => setModalOpen(false)}
      />
      <AppConfirmModal
        open={deleteId !== null}
        title="Delete question"
        message="Delete this question? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        loading={deleteLoading}
        onCancel={() => !deleteLoading && setDeleteId(null)}
        onConfirm={confirmDelete}
      />
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Questions — test {testId}</h1>
          <Link
            href="/admin/tests"
            className="text-sm text-cyan-300 hover:underline"
          >
            All tests
          </Link>
        </div>

        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Add question</h2>
          <textarea
            placeholder="Question text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full min-h-[80px] rounded-lg bg-slate-800 p-3 border border-white/10"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Option A"
              value={optA}
              onChange={(e) => setOptA(e.target.value)}
              className="rounded-lg bg-slate-800 p-3 border border-white/10"
            />
            <input
              placeholder="Option B"
              value={optB}
              onChange={(e) => setOptB(e.target.value)}
              className="rounded-lg bg-slate-800 p-3 border border-white/10"
            />
            <input
              placeholder="Option C (optional)"
              value={optC}
              onChange={(e) => setOptC(e.target.value)}
              className="rounded-lg bg-slate-800 p-3 border border-white/10"
            />
            <input
              placeholder="Option D (optional)"
              value={optD}
              onChange={(e) => setOptD(e.target.value)}
              className="rounded-lg bg-slate-800 p-3 border border-white/10"
            />
          </div>
          <input
            placeholder="Correct answer (exact text of one option)"
            value={correct}
            onChange={(e) => setCorrect(e.target.value)}
            className="w-full rounded-lg bg-slate-800 p-3 border border-white/10"
          />
          <button
            type="button"
            onClick={addQuestion}
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 py-3 font-semibold hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Add question"}
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Bank ({questions.length})</h2>
          {questions.length === 0 ? (
            <p className="text-slate-500 text-sm">No questions yet.</p>
          ) : (
            <ul className="space-y-4">
              {questions.map((q) => (
                <li
                  key={q.id}
                  className="rounded-lg border border-white/10 bg-slate-800/40 p-4"
                >
                  <p className="font-medium mb-2">{q.question}</p>
                  <ul className="text-sm text-slate-300 mb-2 list-disc pl-5">
                    {(q.options || []).map((o: string, i: number) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-emerald-400 mb-3">
                    Answer: {q.correctAnswer}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDeleteId(q.id)}
                    className="text-sm text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}