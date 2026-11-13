import {
  applyRemoteSessionCommand,
  getRemoteSession,
  normalizeRoomCode,
} from "@/lib/remote/session-store";
import { normalizeLogoDataUrl } from "@/lib/logo";
import { normalizeLogoZoom } from "@/lib/logo-zoom";
import type { SessionConfig } from "@/lib/timer";
import type { SessionCommand } from "@/lib/remote/types";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const payload = getRemoteSession(normalizeRoomCode(code));

  if (!payload) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const revisionParam = new URL(request.url).searchParams.get("revision");
  const clientRevision = revisionParam ? Number.parseInt(revisionParam, 10) : null;

  if (
    clientRevision !== null &&
    !Number.isNaN(clientRevision) &&
    clientRevision === payload.revision
  ) {
    return new Response(null, { status: 204 });
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

  if (type === "setLogo" && "logoDataUrl" in record) {
    const logoDataUrl =
      record.logoDataUrl === null
        ? null
        : normalizeLogoDataUrl(record.logoDataUrl);
    if (record.logoDataUrl !== null && logoDataUrl === null) {
      return null;
    }
    return { type: "setLogo", logoDataUrl };
  }

  if (type === "setLogoZoom" && typeof record.zoom === "number") {
    return { type: "setLogoZoom", zoom: normalizeLogoZoom(record.zoom) };
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
