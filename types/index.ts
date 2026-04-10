export type UserRole = "buyer" | "seller" | "admin";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "paid" | "pending" | "failed";
export type WalletTopUpStatus = "pending" | "approved" | "rejected";
export type WalletTransactionType = "credit" | "debit";
export type WalletTransactionSource = "wallet_top_up" | "wallet_order";
export type NotificationType =
  | "seller_new_order"
  | "buyer_delivery_alert";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: unknown;
  storeName?: string;
  storeApproved?: boolean;
  phone?: string;
  address?: string;
  storeDescription?: string;
  storeLogo?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  gender?: "male" | "female" | "other";
  panCardName?: string;
  panCardNumber?: string;
  savedUpiIds?: string[];
  savedCards?: string[];
  giftCardBalance?: number;
  walletBalance?: number;
  walletUpdatedAt?: unknown;
}

export interface PushTokenRecord {
  token: string;
  provider: "expo";
  platform: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ProductListingOption {
  name: string;
  values: string[];
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  name: string;
  subtitle?: string;
  brand?: string;
  image?: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  images: string[];
  category: string;
  stock: number;
  rating: number;
  reviews: number;
  isFeatured: boolean;
  isDeal: boolean;
  isActive: boolean;
  highlights?: string[];
  specifications?: ProductSpecification[];
  options?: ProductListingOption[];
  deliveryInfo?: string[];
  returnPolicy?: string;
  warranty?: string;
  createdAt?: unknown;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  sellerId: string;
  category?: string;
}

export interface DeliveryAddress {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sellerId: string;
  category?: string;
}

export interface Order {
  orderId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentReference?: string;
  walletAmountUsed?: number;
  deliveryAddress: DeliveryAddress;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface WalletTopUpRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  utr: string;
  upiId: string;
  status: WalletTopUpStatus;
  submittedAt?: unknown;
  reviewedAt?: unknown;
  updatedAt?: unknown;
  reviewedById?: string;
  reviewedByEmail?: string;
  note?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: WalletTransactionType;
  source: WalletTransactionSource;
  status: "completed";
  description: string;
  balanceAfter: number;
  createdAt?: unknown;
  orderId?: string;
  topUpRequestId?: string;
  utr?: string;
}

export interface Review {
  id?: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt?: unknown;
}

export interface Coupon {
  code: string;
  type: "flat" | "percent";
  value: number;
  minAmount?: number;
  active?: boolean;
}

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type?: NotificationType;
  orderId?: string;
  route?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  read: boolean;
}
