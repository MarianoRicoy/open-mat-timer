export const MAX_LOGO_DATA_URL_LENGTH = 512_000;

const ALLOWED_PREFIXES = [
  "data:image/png;",
  "data:image/jpeg;",
  "data:image/jpg;",
  "data:image/webp;",
  "data:image/svg+xml;",
];

export function isValidLogoDataUrl(value: string): boolean {
  if (value.length > MAX_LOGO_DATA_URL_LENGTH) {
    return false;
  }

  return ALLOWED_PREFIXES.some((prefix) => value.startsWith(prefix));
}

export function normalizeLogoDataUrl(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  return isValidLogoDataUrl(value) ? value : null;
}

export async function readImageFileAsDataUrl(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) {
    return null;
  }

  if (file.size > 400_000) {
    return null;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      resolve(result && isValidLogoDataUrl(result) ? result : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
