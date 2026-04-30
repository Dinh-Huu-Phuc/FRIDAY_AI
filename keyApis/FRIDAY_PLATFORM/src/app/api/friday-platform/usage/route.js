import { cookies } from "next/headers";
import { apiConfig } from "@/api/apiConfig";
import { backendRequest } from "@/api/backendClient";

export async function GET() {
  const token = (await cookies()).get("friday_access_token")?.value;
  if (!token) return Response.json({ ok: false, message: "Unauthenticated." }, { status: 401 });
  try {
    const data = await backendRequest(apiConfig.paths.usage, { token });
    return Response.json(data);
  } catch {
    return Response.json({ ok: false, message: "Usage data unavailable." }, { status: 503 });
  }
}
