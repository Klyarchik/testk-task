const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export function getToken() {
  return localStorage.getItem("pepe_token");
}

export function setToken(token) {
  localStorage.setItem("pepe_token", token);
}

export function clearToken() {
  localStorage.removeItem("pepe_token");
}

export async function api(path, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}
