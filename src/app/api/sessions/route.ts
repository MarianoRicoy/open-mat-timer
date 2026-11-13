import { createRemoteSession } from "@/lib/remote/session-store";

export async function POST() {
  const payload = createRemoteSession();
  return Response.json(payload, { status: 201 });
}
