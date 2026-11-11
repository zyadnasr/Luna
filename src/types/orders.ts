import type { Locale } from "@/config/site";
import type { OrderSource, ProductAvailabilityStatus } from "./domain";
export type OrderType = "table" | "delivery" | "external";
export type OrderStatus =
  "new" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled" | "rejected";
export type PaymentMethod = "cash" | "card" | "instapay";
export type PaymentStatus =
  "pending" | "proof_submitted" | "verified" | "rejected" | "cash_pending" | "paid" | "refunded";
export type CartItem = {
  productId: string;
  priceId: string;
  quantity: number;
  productName?: string;
  productNameByLocale?: Partial<Record<Locale, string>>;
  priceLabel?: string | null;
  unitPrice?: number;
};
export type OrderContext = {
  type: OrderType;
  qrCode?: string;
  tableId?: string;
  branchId?: string;
};
export type OrderInput = {
  source: OrderSource;
  context: OrderContext;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryZoneId?: string;
  deliveryAddress?: string;
  deliveryLocationUrl?: string;
  customerNotes?: string;
  requestedDeliveryTime?: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  attribution?: OrderAttribution;
  items: CartItem[];
  paymentProof?: File;
};
export type OrderAttribution = {
  source?: string | null;
  type?: string | null;
  referrer?: string | null;
  landingPage?: string | null;
  sessionId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
};
export type OrderErrorCode =
  | "generic"
  | "emptyCart"
  | "cardUnavailable"
  | "instapayNotConfigured"
  | "paymentProofRequired"
  | "invalidName"
  | "invalidPhone"
  | "invalidAddress"
  | "invalidLocation"
  | "invalidTableContext"
  | "deliveryRequired"
  | "invalidQrCode"
  | "productUnavailable"
  | "cartSelectionUnavailable"
  | "insufficientStock"
  | "zoneUnavailable"
  | "invalidCoupon"
  | "minimumOrderNotMet"
  | "createOrderFailed"
  | "uploadProofFailed"
  | "saveOrderItemsFailed";
export type OrderResult = {
  success: boolean;
  message: string;
  errorCode?: OrderErrorCode;
  orderNumber?: string;
  lookupToken?: string;
  subtotal?: number;
  discount?: number;
  total?: number;
  couponCode?: string | null;
};
export type OrderProductReference = {
  id: string;
  availability_status: ProductAvailabilityStatus;
  product_translations: Array<{ locale: string; name: string }>;
  product_prices: Array<{
    id: string;
    label: string | null;
    price_egp: number;
    compare_at_price_egp?: number | null;
    is_active: boolean;
    valid_until: string | null;
  }>;
};
