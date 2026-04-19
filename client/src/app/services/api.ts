const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://lamp-toz7.onrender.com"
).replace(/\/$/, "");

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