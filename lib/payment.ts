import { httpsCallable } from "firebase/functions";

import { functions } from "../firebaseConfig";

const FALLBACK_STRIPE_PUBLISHABLE_KEY = "pk_test_TYooMQauvdEDq54NiTphI7jx";
export const merchantUpiId = "9120689422@ybl";
export const merchantUpiName = "ShopApp Store";

export const stripePublishableKey =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  FALLBACK_STRIPE_PUBLISHABLE_KEY;

interface PaymentSheetResponse {
  customerId: string;
  ephemeralKeySecret: string;
  paymentIntentClientSecret: string;
  publishableKey?: string;
}

export const createPaymentSheetParams = async (
  amount: number,
  email: string
) => {
  const callable = httpsCallable(functions, "createPaymentSheet");

  const result = await callable({
    amount,
    email,
  });

  return result.data as PaymentSheetResponse;
};

export const buildUpiPaymentUri = (
  amount: number,
  transactionNote = "ShopApp Order Payment",
  transactionReference?: string
) => {
  const params = [
    ["pa", merchantUpiId],
    ["pn", merchantUpiName],
    ["am", amount.toFixed(2)],
    ["cu", "INR"],
    ["tr", transactionReference || `SHOPAPP-${Date.now()}`],
    ["tn", transactionNote],
  ]
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  return `upi://pay?${params}`;
};

export const buildUpiQrCodeUrl = (upiUri: string, size = 320) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiUri)}`;
