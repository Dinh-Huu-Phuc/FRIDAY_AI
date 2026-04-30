import { backendUrl } from "@/api/apiConfig";

export async function backendRequest(path, { method = "GET", body, token, headers = {} } = {}) {
  const response = await fetch(backendUrl(path), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store"
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = { message: response.statusText };
  }

  if (!response.ok) {
    const message = data?.detail || data?.message || "Backend request failed";
    const error = new Error(Array.isArray(message) ? "Validation failed" : message);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export function routeError(error) {
  return Response.json(
    { ok: false, message: error.message || "Request failed", details: error.data || null },
    { status: error.status || 500 }
  );
}
