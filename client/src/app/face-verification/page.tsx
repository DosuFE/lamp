"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, clearAuthStorage } from "@/app/services/api";
import { AppMessageModal } from "@/components/AppMessageModal";
import { OverlayPreloader } from "@/components/OverlayPreloader";

type Mode = "capture" | "verify";

export default function FaceVerificationPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [mode, setMode] = useState<Mode>("capture");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProfile(true);
      try {
        const profile = await api<{
          hasFaceProfile?: boolean;
          faceVerificationRequired?: boolean;
        }>("/auth/profile");
        if (cancelled) return;
        const hasFace = Boolean(profile.hasFaceProfile);
        const required = Boolean(profile.faceVerificationRequired);

        if (hasFace && !required) {
          router.replace("/dashboard");
          return;
        }
        setMode(hasFace ? "verify" : "capture");
      } catch {
        clearAuthStorage();
        router.replace("/login");
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (loadingProfile) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((item) => item.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setCameraReady(true);
      } catch {
        setModalMessage(
          "Camera access is required. Please allow camera and reload this page.",
        );
        setModalOpen(true);
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((item) => item.stop());
      streamRef.current = null;
    };
  }, [loadingProfile]);

  const getCapture = (): string => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      throw new Error("Camera is not ready.");
    }
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not read camera frame.");
    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.72);
  };

  const runFaceAction = async () => {
    try {
      setProcessing(true);
      const imageBase64 = getCapture();
      const endpoint = mode === "capture" ? "/auth/face/capture" : "/auth/face/verify";
      await api(endpoint, {
        method: "POST",
        body: JSON.stringify({ imageBase64 }),
      });
      router.replace("/dashboard");
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.code === "FACE_MISMATCH_LOGOUT") {
        clearAuthStorage();
        router.replace("/login");
        return;
      }
      setModalMessage(apiError.message || "Face validation failed.");
      setModalOpen(true);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <OverlayPreloader
        open={loadingProfile || processing}
        label={
          loadingProfile
            ? "Checking profile..."
            : processing
              ? "Validating face..."
              : undefined
        }
      />
      <AppMessageModal
        open={modalOpen}
        title="Face Verification"
        message={modalMessage}
        variant="error"
        onClose={() => setModalOpen(false)}
      />
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {mode === "capture" ? "Capture your face" : "Verify your face"}
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          You must pass face verification before opening dashboard features, enrolling in
          courses, or taking tests.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black">
          <video
            ref={videoRef}
            className="w-full aspect-video object-cover"
            autoPlay
            muted
            playsInline
          />
        </div>
        <canvas ref={canvasRef} className="hidden" />

        <button
          type="button"
          onClick={runFaceAction}
          disabled={!cameraReady || processing}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3 font-semibold disabled:opacity-60"
        >
          {mode === "capture" ? "Capture Face And Continue" : "Verify Face And Continue"}
        </button>
      </div>
    </div>
  );
}
