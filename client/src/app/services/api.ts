export function getApiBase() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://lamp-2-x9xg.onrender.com/"
  ).replace(/\/$/, "");
  // const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  // if (configuredBase) return configuredBase.replace(/\/$/, "");

  // if (process.env.NODE_ENV !== "production") {
  //   return "http://localhost:5051";
  // }

  return "https://lamp-2-x9xg.onrender.com/";
}

const API_BASE = getApiBase();
const REQUEST_TIMEOUT_MS = 25000;

type ApiOptions = RequestInit & {
  headers?: HeadersInit;
};

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "AbortError"
  );
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export const api = async (url: string, options: ApiOptions = {}) => {
  const token = getToken();
  const path = url.startsWith("/") ? url : `/${url}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const mergedHeaders = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  if (options.body instanceof FormData) {
    delete (mergedHeaders as Record<string, string>)["Content-Type"];
  }

  let res: Response;

  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: mergedHeaders,
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw new Error("Request timed out. Please try again.");
    }
    throw new Error("Network error. Please check your connection and try again.");
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data: Record<string, unknown> = isJson
    ? await res.json().then(toRecord).catch(() => ({}))
    : {};

  if (!res.ok) {
    console.error("API ERROR:", data);
    throw new Error(
      (typeof data.message === "string" ? data.message : undefined) ||
        `Request failed with status ${res.status}${res.statusText ? ` (${res.statusText})` : ""}`,
    );
  }

  return data;
};

export async function uploadLecturePdfToCloudinary(file: File) {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/upload/pdf`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  const data: Record<string, unknown> = await res
    .json()
    .then(toRecord)
    .catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.message === "string" ? data.message : "PDF upload failed",
    );
  }
  if (typeof data.url !== "string" || !data.url) {
    throw new Error("PDF upload failed");
  }
  return { url: data.url };
}