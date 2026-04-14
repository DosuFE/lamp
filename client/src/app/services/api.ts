export const api = async (url: string, options: any = {}) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:5051${url}`, {
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