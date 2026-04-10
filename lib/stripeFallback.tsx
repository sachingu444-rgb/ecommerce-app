import { PropsWithChildren } from "react";

interface StripeProviderProps extends PropsWithChildren {
  publishableKey?: string;
  merchantIdentifier?: string;
}

interface StripeSheetResult {
  error?: {
    message: string;
  };
}

export const StripeProvider = ({ children }: StripeProviderProps) => children;

export const useStripe = () => ({
  initPaymentSheet: async (): Promise<StripeSheetResult> => ({
    error: {
      message: "Card payments are not enabled in this build.",
    },
  }),
  presentPaymentSheet: async (): Promise<StripeSheetResult> => ({
    error: {
      message: "Card payments are not enabled in this build.",
    },
  }),
});
