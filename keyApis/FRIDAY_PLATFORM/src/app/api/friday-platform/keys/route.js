import { cookies } from "next/headers";
import { apiConfig } from "@/api/apiConfig";
import { backendRequest, routeError } from "@/api/backendClient";
import { normalizeApiKeyList, normalizeCreateKeyResponse } from "@/utils/apiKeyUtils";

async function tokenOr401() {
  const token = (await cookies()).get("friday_access_token")?.value;
  if (!token) throw Object.assign(new Error("Unauthenticated."), { status: 401 });
  return token;
}

export async function GET() {
  try {
    const token = await tokenOr401();
    const data = await backendRequest(apiConfig.paths.apiKeys, { token });
    return Response.json({ items: normalizeApiKeyList(data) });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request) {
  try {
    const token = await tokenOr401();
    const payload = await request.json();
    if (!payload.name) return Response.json({ ok: false, message: "Key name is required." }, { status: 400 });
    const data = await backendRequest(apiConfig.paths.apiKeys, { method: "POST", token, body: payload });
    return Response.json(normalizeCreateKeyResponse(data));
  } catch (error) {
    return routeError(error);
  }
}
