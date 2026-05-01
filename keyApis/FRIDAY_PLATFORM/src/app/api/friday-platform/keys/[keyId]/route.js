import { cookies } from "next/headers";
import { apiConfig } from "@/api/apiConfig";
import { backendRequest, routeError } from "@/api/backendClient";
import { normalizeApiKeyRecord, normalizeCreateKeyResponse } from "@/utils/apiKeyUtils";

async function tokenOr401() {
  const token = (await cookies()).get("friday_access_token")?.value;
  if (!token) throw Object.assign(new Error("Unauthenticated."), { status: 401 });
  return token;
}

export async function PATCH(request, context) {
  try {
    const token = await tokenOr401();
    const { keyId } = await context.params;
    const payload = await request.json();
    if (payload.action === "rotate") {
      const data = await backendRequest(`${apiConfig.paths.apiKeys}/${keyId}/rotate`, { method: "POST", token });
      return Response.json(normalizeCreateKeyResponse(data));
    }
    if (payload.action === "revoke") {
      const data = await backendRequest(`${apiConfig.paths.apiKeys}/${keyId}/revoke`, { method: "POST", token });
      return Response.json({ record: normalizeApiKeyRecord(data.api_key || data.record || data) });
    }
    return Response.json({ ok: false, message: "Unknown key action." }, { status: 400 });
  } catch (error) {
    if (error.status === 404 && error.message.includes("rotate")) {
      return Response.json({ ok: false, message: "Rotate endpoint is not available on the backend yet." }, { status: 501 });
    }
    return routeError(error);
  }
}

export async function DELETE(request, context) {
  try {
    const token = await tokenOr401();
    const { keyId } = await context.params;
    const data = await backendRequest(`${apiConfig.paths.apiKeys}/${keyId}`, { method: "DELETE", token });
    return Response.json({ record: normalizeApiKeyRecord(data.api_key || data.record || data) });
  } catch (error) {
    return routeError(error);
  }
}
