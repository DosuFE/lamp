export function getApiBase() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://lamp-h3us.onrender.com"
  ).replace(/\/$/, "");
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

export async function uploadLecturePdf(file: File) {
  const token = localStorage.getItem("token");
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/lectures/pdf-upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "PDF upload failed");
  }
  return data as { pdfUrl: string; pdfFileName: string };
}
