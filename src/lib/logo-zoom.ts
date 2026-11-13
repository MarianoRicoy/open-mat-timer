export const DEFAULT_LOGO_ZOOM = 1;
export const MIN_LOGO_ZOOM = 0.75;
export const MAX_LOGO_ZOOM = 3;

export function clampLogoZoom(value: number): number {
  if (Number.isNaN(value)) {
    return DEFAULT_LOGO_ZOOM;
  }

  return Math.min(MAX_LOGO_ZOOM, Math.max(MIN_LOGO_ZOOM, value));
}

export function normalizeLogoZoom(value: unknown): number {
  if (typeof value !== "number") {
    return DEFAULT_LOGO_ZOOM;
  }

  return clampLogoZoom(value);
}
