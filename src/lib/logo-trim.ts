/**
 * Bounding box of visible artwork. Ignores transparent pixels and near-pure-black
 * opaque letterboxing (common in PNG exports). Keeps darker tones that are not
 * uniform margin black (e.g. skull shading) via a slightly higher luma floor.
 */
function isContentPixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 24) {
    return false;
  }

  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (luma >= 34) {
    return true;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min >= 22 && luma >= 14) {
    return true;
  }

  return false;
}

function measureContentFillRatio(
  image: HTMLImageElement,
): { fillRatio: number } | null {
  const width = image.naturalWidth;
  const height = image.naturalHeight;

  if (width < 1 || height < 1) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return null;
  }

  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, width, height);

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (
        isContentPixel(
          data[index] ?? 0,
          data[index + 1] ?? 0,
          data[index + 2] ?? 0,
          data[index + 3] ?? 0,
        )
      ) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return null;
  }

  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;
  const fillRatio = Math.max(contentWidth / width, contentHeight / height);

  return { fillRatio };
}

/**
 * Auto scale factor when the file has large transparent or black margins.
 * Manual zoom in the panel stacks on top (product of both).
 */
export function measureLogoContentBoost(image: HTMLImageElement): number {
  const measured = measureContentFillRatio(image);

  if (!measured) {
    return 1;
  }

  const { fillRatio } = measured;

  if (fillRatio >= 0.72) {
    return 1;
  }

  return Math.min(3.2, 1 / fillRatio);
}
