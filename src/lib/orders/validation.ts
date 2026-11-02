export function isValidPaymentProof(file: { type: string; size: number } | null | undefined) {
  return (
    !!file &&
    ["image/png", "image/jpeg", "image/webp"].includes(file.type) &&
    file.size <= 5 * 1024 * 1024
  );
}

const egyptianMobileLocalPattern = /^1[0125][0-9]{8}$/;
const customerNamePattern = /^[\p{L}]+(?:[\s.'-]+[\p{L}]+)*$/u;
const deliveryAddressPattern = /[\p{L}\p{N}]/u;

export function normalizeCustomerName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeDeliveryAddress(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidDeliveryAddress(value: string) {
  const address = normalizeDeliveryAddress(value);
  return address.length >= 5 && address.length <= 240 && deliveryAddressPattern.test(address);
}

export function isValidLocationUrl(value: string) {
  if (!value.trim()) return false;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (hostname === "google.com" ||
        hostname.endsWith(".google.com") ||
        hostname === "goo.gl" ||
        hostname.endsWith(".goo.gl"))
    );
  } catch {
    return false;
  }
}

export function isValidCustomerName(value: string) {
  const name = normalizeCustomerName(value);
  return name.length >= 2 && name.length <= 80 && customerNamePattern.test(name);
}

export function normalizeEgyptianPhoneInput(value: string) {
  const digits = value.replace(/[^0-9]/g, "");
  const withoutCountryCode = digits.startsWith("20") ? digits.slice(2) : digits;
  const local = withoutCountryCode.startsWith("0")
    ? withoutCountryCode.slice(1)
    : withoutCountryCode;
  return local.slice(0, 10);
}

export function isValidEgyptianPhone(value: string) {
  return egyptianMobileLocalPattern.test(normalizeEgyptianPhoneInput(value));
}

export function normalizeEgyptianPhone(value: string) {
  const local = normalizeEgyptianPhoneInput(value);
  return isValidEgyptianPhone(local) ? `0${local}` : local;
}
