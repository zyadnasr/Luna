const productImageTypeByExtension = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
} as const;

export const maxProductImageSize = 5 * 1024 * 1024;

export function getProductImageType(file: Pick<File, "name" | "type">) {
  const mimeType = file.type.trim().toLowerCase();
  const allowedMimeTypes = Object.values(productImageTypeByExtension) as string[];

  if (allowedMimeTypes.includes(mimeType)) {
    return mimeType as (typeof productImageTypeByExtension)[keyof typeof productImageTypeByExtension];
  }

  const extension = file.name.split(".").pop()?.trim().toLowerCase();
  return extension
    ? productImageTypeByExtension[extension as keyof typeof productImageTypeByExtension] ?? null
    : null;
}

export function isValidProductImage(file: Pick<File, "name" | "type" | "size">) {
  return Boolean(getProductImageType(file)) && file.size > 0 && file.size <= maxProductImageSize;
}
