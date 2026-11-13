import {
  applyRemoteSessionCommand,
  getRemoteSession,
  normalizeRoomCode,
} from "@/lib/remote/session-store";
import type { SessionConfig } from "@/lib/timer";
import type { SessionCommand } from "@/lib/remote/types";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { code } = await context.params;
  const payload = getRemoteSession(normalizeRoomCode(code));

  if (!payload) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  return Response.json(payload);
}

function parseCommand(body: unknown): SessionCommand | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const type = record.type;

  if (type === "start" || type === "pause" || type === "resume" || type === "reset") {
    return { type };
  }

  if (type === "patchConfig" && record.partial && typeof record.partial === "object") {
    return {
      type: "patchConfig",
      partial: record.partial as Partial<SessionConfig>,
    };
  }

  if (type === "applyPreset" && typeof record.presetId === "string") {
    return { type: "applyPreset", presetId: record.presetId };
  }

  return null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const normalized = normalizeRoomCode(code);
  const command = parseCommand(await request.json());

  if (!command) {
    return Response.json({ error: "Invalid command" }, { status: 400 });
  }

  const payload = applyRemoteSessionCommand(normalized, command);

  if (!payload) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  return Response.json(payload);
}
