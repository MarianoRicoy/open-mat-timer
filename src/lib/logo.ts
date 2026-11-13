export const MAX_LOGO_DATA_URL_LENGTH = 900_000;
export const MAX_LOGO_FILE_BYTES = 5_000_000;

const ALLOWED_PREFIXES = [
  "data:image/png;",
  "data:image/jpeg;",
  "data:image/jpg;",
  "data:image/webp;",
  "data:image/svg+xml;",
];

const IMAGE_EXT_PATTERN = /\.(png|jpe?g|webp|svg|gif|bmp|heic|heif)$/i;

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

function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true;
  }

  return IMAGE_EXT_PATTERN.test(file.name);
}

function isSvgFile(file: File): boolean {
  return file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
}

const LOGO_MAX_EDGE_PX = 1280;

function readFileAsDataUrl(file: File): Promise<string | null> {
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

async function rasterViaCanvas(file: File): Promise<string | null> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const loaded = await new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = objectUrl;
    });

    if (!loaded || loaded.naturalWidth < 1 || loaded.naturalHeight < 1) {
      return null;
    }

    const longestEdge = Math.max(loaded.naturalWidth, loaded.naturalHeight);
    const scale =
      longestEdge > LOGO_MAX_EDGE_PX ? LOGO_MAX_EDGE_PX / longestEdge : 1;
    const width = Math.max(1, Math.round(loaded.naturalWidth * scale));
    const height = Math.max(1, Math.round(loaded.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      return null;
    }

    context.drawImage(loaded, 0, 0, width, height);

    const jpeg = canvas.toDataURL("image/jpeg", 0.88);
    if (isValidLogoDataUrl(jpeg)) {
      return jpeg;
    }

    const png = canvas.toDataURL("image/png");
    return isValidLogoDataUrl(png) ? png : null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function readImageFileAsDataUrl(file: File): Promise<string | null> {
  if (!isLikelyImageFile(file)) {
    return null;
  }

  if (file.size > MAX_LOGO_FILE_BYTES) {
    return null;
  }

  if (isSvgFile(file)) {
    return readFileAsDataUrl(file);
  }

  const encoded = await rasterViaCanvas(file);
  if (encoded) {
    return encoded;
  }

  return readFileAsDataUrl(file);
}
