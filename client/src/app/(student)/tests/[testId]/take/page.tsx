"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ApiError, api, clearAuthStorage } from "@/app/services/api";
import { AppMessageModal } from "@/components/AppMessageModal";

type Q = { id: number; question: string; options: string[] };
type ResultSummary = {
  score: number;
  totalQuestions: number;
  percentage: number;
  grade: string;
  malpracticeFlag?: boolean;
};

function reportTabSwitch(testId: string) {
  return api(`/tests/${testId}/report-tab-switch`, {
    method: "POST",
    body: "{}",
  });
}

function reportWebcam(testId: string, isOn: boolean) {
  return api(`/tests/${testId}/report-webcam-status`, {
    method: "POST",
    body: JSON.stringify({ isOn }),
  });
}

function ensureDeviceLocation(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(
        new Error(
          "This browser does not support location. Use a current browser and try again.",
        ),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => resolve(),
      (err) => {
        const code = err.code;
        if (code === 1) {
          reject(
            new Error(
              "Location permission is off. Allow location for this site in your browser settings, then try again.",
            ),
          );
        } else if (code === 2) {
          reject(
            new Error(
              "Device location is off or unavailable. Turn on location (GPS) for this device, then try again.",
            ),
          );
        } else if (code === 3) {
          reject(
            new Error(
              "Location request timed out. Turn on location services, move to an area with a better signal, and try again.",
            ),
          );
        } else {
          reject(
            new Error(
              "Could not read your location. Turn on device location and allow access, then try again.",
            ),
          );
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 25_000,
      },
    );
  });
}

export default function TakeTestPage() {
  const params = useParams();
  const testId = String(params.testId ?? "");

  const [phase, setPhase] = useState<"load" | "ready" | "done">("load");
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [remainingSec, setRemainingSec] = useState(0);
  const [startedAtIso, setStartedAtIso] = useState("");
  const [resultSummary, setResultSummary] = useState<ResultSummary | null>(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [camLabel, setCamLabel] = useState<string>("Starting camera…");
  const [submitErrorOpen, setSubmitErrorOpen] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [faceMismatchOpen, setFaceMismatchOpen] = useState(false);
  const [faceMismatchImage, setFaceMismatchImage] = useState<string>("");
  const [faceWarning, setFaceWarning] = useState("");
  const [challenge, setChallenge] = useState("");
  const submittedRef = useRef(false);
  const deadlineRef = useRef<number | null>(null);
  const answersRef = useRef<Record<number, string>>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const webcamOffReportedRef = useRef(false);

  const storageKey = `cbt_${testId}_startedAt`;
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const submit = useCallback(
    async (reason: "manual" | "timer") => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      const started =
        startedAtIso || sessionStorage.getItem(storageKey) || undefined;
      try {
        const res = await api(`/tests/${testId}/submit`, {
          method: "POST",
          body: JSON.stringify({
            answers: answersRef.current,
            startedAt: started,
          }),
        });
        sessionStorage.removeItem(storageKey);
        setResultSummary(res as ResultSummary);
        setPhase("done");
      } catch (e: unknown) {
        submittedRef.current = false;
        const message = e instanceof Error ? e.message : "";
        if (reason === "timer") {
          setError(message || "Submit failed after time expired.");
        } else {
          setSubmitErrorMessage(message || "Submit failed.");
          setSubmitErrorOpen(true);
        }
      }
    },
    [startedAtIso, testId, storageKey],
  );

  useEffect(() => {
    if (!testId) return;
    let cancelled = false;

    (async () => {
      try {
        const qs = await api<Q[]>(`/tests/${testId}`);
        if (cancelled) return;
        setQuestions(qs);

        await ensureDeviceLocation();
        if (cancelled) return;

        const start = await api<{
          startedAt: string;
          timeLimitSeconds: number;
        }>(`/tests/${testId}/start`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        if (cancelled) return;

        const iso = new Date(start.startedAt).toISOString();
        setStartedAtIso(iso);
        sessionStorage.setItem(storageKey, iso);

        const limit = Number(start.timeLimitSeconds) || 0;
        const elapsed = Math.floor(
          (Date.now() - new Date(iso).getTime()) / 1000,
        );
        const left = Math.max(0, limit - elapsed);
        deadlineRef.current = Date.now() + left * 1000;
        setRemainingSec(left);
        setPhase("ready");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "";
        if (!cancelled) setError(message || "Could not start test.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [testId, storageKey]);

  useEffect(() => {
    if (phase !== "ready" || !testId) return;

    const loadChallenge = async () => {
      try {
        const res = await api<any>(`/tests/${testId}/face-challenge`);
        setChallenge(res.challenge);
      } catch {}
    };

    loadChallenge();
  }, [phase, testId]);

  useEffect(() => {
    if (phase !== "ready" || !deadlineRef.current) return;

    const tick = () => {
      const left = Math.max(
        0,
        Math.ceil((deadlineRef.current! - Date.now()) / 1000),
      );
      setRemainingSec(left);
      if (left <= 0) {
        submit("timer");
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [phase, submit]);

  useEffect(() => {
    if (phase !== "ready" || !testId) return;

    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      reportTabSwitch(testId)
        .then(() =>
          setTabSwitchCount((c) => c + 1),
        )
        .catch(() => {});
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase, testId]);

  useEffect(() => {
    if (phase !== "ready" || !testId) return;

    let cancelled = false;
    let detachTrackListeners: (() => void) | undefined;
    const streamHolder: { stream: MediaStream | null } = { stream: null };
    const streamReadyAt = { t: 0 };

    webcamOffReportedRef.current = false;

    const reportOffOnce = () => {
      if (webcamOffReportedRef.current || cancelled) return;
      webcamOffReportedRef.current = true;
      reportWebcam(testId, false).catch(() => {});
      setCamLabel("Camera off or blocked — incident recorded");
    };

    const reportOn = () => {
      webcamOffReportedRef.current = false;
      reportWebcam(testId, true).catch(() => {});
      setCamLabel("Camera active");
    };

    const attachTrackWatchers = (track: MediaStreamTrack) => {
      const onEnded = () => {
        reportOffOnce();
        setCamLabel("Camera stopped — incident recorded");
      };
      const onMute = () => {
        if (Date.now() - streamReadyAt.t < 2500) return;
        if (track.muted) {
          reportOffOnce();
          setCamLabel("Camera muted / no signal — incident recorded");
        }
      };
      const onUnmute = () => {
        if (!track.muted && track.readyState === "live") {
          reportOn();
        }
      };
      track.addEventListener("ended", onEnded);
      track.addEventListener("mute", onMute);
      track.addEventListener("unmute", onUnmute);
      return () => {
        track.removeEventListener("ended", onEnded);
        track.removeEventListener("mute", onMute);
        track.removeEventListener("unmute", onUnmute);
      };
    };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamLabel("Camera API not available");
        reportOffOnce();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamHolder.stream = stream;
        camStreamRef.current = stream;
        streamReadyAt.t = Date.now();

        requestAnimationFrame(() => {
          if (cancelled || !videoRef.current || !streamHolder.stream) return;
          videoRef.current.srcObject = streamHolder.stream;
          void videoRef.current.play().catch(() => {});
        });

        const vt = stream.getVideoTracks()[0];
        if (vt) {
          detachTrackListeners = attachTrackWatchers(vt);
          if (vt.readyState === "live" && !vt.muted) {
            await reportOn();
          }
        }
      } catch {
        if (!cancelled) {
          setCamLabel("Permission denied — camera required for proctoring");
          reportOffOnce();
        }
      }
    })();

    return () => {
      cancelled = true;
      detachTrackListeners?.();
      const s = streamHolder.stream ?? camStreamRef.current;
      const videoEl = videoRef.current;
      streamHolder.stream = null;
      camStreamRef.current = null;
      s?.getTracks().forEach((t) => t.stop());
      if (videoEl) {
        videoEl.srcObject = null;
      }
    };
  }, [phase, testId]);

  const getLiveCapture = useCallback((): string => {
    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!video) {
      throw new Error("Camera is not ready.");
    }
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvasRef.current = canvas;
    }
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not read camera frame.");
    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.72);
  }, []);

  const captureFrames = useCallback(async () => {
    const frames: string[] = [];

    for (let i = 0; i < 3; i++) {
      frames.push(getLiveCapture());
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return frames;
  }, [getLiveCapture]);

  useEffect(() => {
    if (phase !== "ready" || !testId) return;

    let cancelled = false;
    let inFlight = false;
    let mismatchTriggered = false;

    const runCheck = async () => {
      if (cancelled || inFlight || mismatchTriggered) return;
      const videoEl = videoRef.current;
      if (!videoEl || videoEl.readyState < 2) return;

      let frames: string[] = [];
      try {
        frames = await captureFrames();
      } catch {
        return;
      }

      inFlight = true;
      try {
        const res = await api<any>(
        `/tests/${testId}/face-check`,
        {
          method: "POST",
          body: JSON.stringify({ frames }),
          suppressAutoRedirect: true,
        }
      );

      if (res?.warning) {
        setFaceWarning(
          `Face mismatch warning ${res.warningCount}/5`
        );

        setTimeout(() => {
          setFaceWarning("");
        }, 4000);
      }
        } finally {
          inFlight = false;
        }
      };

    let timeoutId = 0;
    const warmup = window.setTimeout(runCheck, 3500);

    const scheduleNextCheck = () => {
      const randomSeconds = Math.floor(Math.random() * 15) + 10;

      timeoutId = window.setTimeout(async () => {
        await runCheck();
        scheduleNextCheck();
      }, randomSeconds * 1000);
    };

    scheduleNextCheck();

    return () => {
      cancelled = true;
      window.clearTimeout(warmup);
      window.clearTimeout(timeoutId);
    };
  }, [phase, testId, captureFrames]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-white gap-4">
        <p className="text-red-400 text-center">{error}</p>
        <Link href="/tests" className="text-cyan-400 hover:underline">
          Back to tests
        </Link>
      </div>
    );
  }

  if (phase === "load") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p>Preparing your exam…</p>
      </div>
    );
  }

  if (phase === "done" && resultSummary) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-slate-900/90 p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold">Test submitted</h1>
          <p className="text-slate-300">
            Score:{" "}
            <span className="text-white font-semibold">
              {resultSummary.score} / {resultSummary.totalQuestions}
            </span>
          </p>
          <p className="text-slate-300">
            Percentage:{" "}
            <span className="text-white font-semibold">
              {resultSummary.percentage}%
            </span>{" "}
            · Grade{" "}
            <span className="text-emerald-400 font-semibold">
              {resultSummary.grade}
            </span>
          </p>
          {resultSummary.malpracticeFlag && (
            <p className="text-amber-400 text-sm">
              Proctoring notice: this attempt was flagged (tab change, camera
              interruption, time over limit, or similar).
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link
              href="/results"
              className="rounded-lg bg-violet-600 px-5 py-2.5 font-semibold"
            >
              View results
            </Link>
            <Link
              href="/tests"
              className="rounded-lg border border-white/20 px-5 py-2.5 font-semibold"
            >
              More tests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <AppMessageModal
        open={submitErrorOpen}
        title="Submit"
        message={submitErrorMessage}
        variant="error"
        onClose={() => setSubmitErrorOpen(false)}
      />
      {faceMismatchOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-red-500/40 bg-slate-900 p-6 shadow-2xl"
          >
            <h2 className="mb-2 text-lg font-semibold text-white">Face Verification</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              Face is not the same with face verification.
            </p>
            {faceMismatchImage ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black">
                <img
                  src={faceMismatchImage}
                  alt="Face captured during test"
                  className="w-full aspect-video object-cover"
                />
              </div>
            ) : null}
            <p className="mt-4 text-xs text-slate-400">
              Logging you out for security…
            </p>
          </div>
        </div>
      ) : null}
      {faceWarning && (
        <div className="fixed top-5 right-5 z-50 rounded-lg bg-yellow-500 px-4 py-3 text-black font-semibold shadow-lg">
          {faceWarning}
        </div>
      )}
      <div className="mx-auto max-w-3xl space-y-6">
        {challenge && (
          <div className="rounded-xl bg-red-600/20 border border-red-500 p-4">
            <p className="font-semibold">Security Check:</p>
            <p>{challenge}</p>
          </div>
        )}
        <div
          className="rounded-xl border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-100/90"
          role="status"
        >
          Location must stay on: the exam only starts after the device shares a
          GPS position. Proctoring: leaving this tab is reported. Camera (if
          allowed) is monitored for loss of video.
          {tabSwitchCount > 0 && (
            <span className="block mt-2 font-semibold text-amber-200">
              Tab-leave events logged this session: {tabSwitchCount}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3">
          <Link href="/tests" className="text-sm text-cyan-400 hover:underline">
            ← Leave (use Submit when finished)
          </Link>
          <div
            className={`text-lg font-mono font-bold ${
              remainingSec <= 60 ? "text-red-400" : "text-cyan-300"
            }`}
          >
            {formatTime(remainingSec)}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <h1 className="text-xl font-bold">Exam</h1>
          <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3 w-full sm:w-56 shrink-0">
            <p className="text-xs text-slate-400 mb-2">Live preview</p>
            <video
              ref={videoRef}
              className="w-full aspect-video rounded-lg bg-black object-cover"
              autoPlay
              playsInline
              muted
            />
            <p className="text-xs text-slate-400 mt-2 leading-snug">{camLabel}</p>
          </div>
        </div>

        <ol className="space-y-8">
          {questions.map((q, idx) => (
            <li
              key={q.id}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"
            >
              <p className="text-sm text-slate-400 mb-2">Question {idx + 1}</p>
              <p className="font-medium mb-4">{q.question}</p>
              <div className="space-y-2">
                {(q.options || []).map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-800/40 px-3 py-2 cursor-pointer hover:bg-slate-800/70"
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === opt}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                      }
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={() => submit("manual")}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-4 text-lg font-semibold"
        >
          Submit exam
        </button>
      </div>
    </div>
  );
}
