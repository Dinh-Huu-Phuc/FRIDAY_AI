import { cookies } from "next/headers";
import { apiConfig } from "@/api/apiConfig";
import { backendRequest, routeError } from "@/api/backendClient";

export async function GET() {
  try {
    const token = (await cookies()).get("friday_access_token")?.value;
    if (!token) return Response.json({ ok: false, message: "Unauthenticated." }, { status: 401 });
    const user = await backendRequest(apiConfig.paths.me, { token });
    return Response.json({ ok: true, user });
  } catch (error) {
    return routeError(error);
  }
}
