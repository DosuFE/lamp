export function getApiBase() {
  const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configuredBase) return configuredBase.replace(/\/$/, "");

  // Use local Nest API during local development to avoid hitting stale remote deployments.
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:5051";
  }

  return "https://lamp-2-9g92.onrender.com/";
}

const API_BASE = getApiBase();

export const api = async (url: string, options: any = {}) => {
  const token = localStorage.getItem("token");
  const path = url.startsWith("/") ? url : `/${url}`;

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("API ERROR:", data);
    throw new Error(data.message || "Request failed");
  }

  return data;
};

export async function uploadLecturePdfToCloudinary(file: File) {
  const token = localStorage.getItem("token");
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/upload/pdf`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    throw new Error(data.message || "PDF upload failed");
  }
  if (!data?.url) {
    throw new Error("PDF upload failed");
  }
  return data as { url: string };
}