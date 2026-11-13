/**
 * Estima un factor de escala cuando el PNG tiene mucho margen transparente.
 * Así el logo ocupa mejor el contenedor sin recortar el arte.
 */
export function measureLogoContentBoost(
  image: HTMLImageElement,
): number {
  const width = image.naturalWidth;
  const height = image.naturalHeight;

  if (width < 1 || height < 1) {
    return 1;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return 1;
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
      if (data[index + 3] > 24) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return 1;
  }

  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;
  const fillRatio = Math.max(contentWidth / width, contentHeight / height);

  if (fillRatio >= 0.72) {
    return 1;
  }

  return Math.min(2.8, 1 / fillRatio);
}
