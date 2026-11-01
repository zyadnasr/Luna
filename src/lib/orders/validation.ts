export function isValidPaymentProof(file: { type: string; size: number } | null | undefined) {
  return (
    !!file &&
    ["image/png", "image/jpeg", "image/webp"].includes(file.type) &&
    file.size <= 5 * 1024 * 1024
  );
}
