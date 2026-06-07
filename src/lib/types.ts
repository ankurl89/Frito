export interface BrandDNA {
  id: string;
  user_id: string;
  name: string;
  tagline: string;
  story: string;
  niche: string;
  target_audience: string;
  brand_values: string[];
  voice_tone: string;
  price_tier: "budget" | "mid" | "premium" | "luxury";
  palette: ColorPalette;
  typography: Typography;
  logo_url?: string;
  logo_prompt?: string;
  status: "draft" | "active";
  created_at: string;
  updated_at: string;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  [key: string]: string;
}

export interface Typography {
  heading: string;
  body: string;
  style: string;
}

export interface Product {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  category: string;
  qikink_product_id: string;
  qikink_product_name: string;
  base_cost: number;
  sell_price: number;
  design_prompt: string;
  design_url?: string;
  mockup_url?: string;
  sku: string;
  variants: ProductVariant[];
  listing_title: string;
  listing_description: string;
  seo_tags: string[];
  status: "draft" | "active" | "archived";
  created_at: string;
}

export interface ProductVariant {
  size?: string;
  color?: string;
  price: number;
  stock?: number;
}

export interface Order {
  id: string;
  brand_id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: ShippingAddress;
  variant: ProductVariant;
  quantity: number;
  total_amount: number;
  cost_amount: number;
  profit_amount: number;
  status: OrderStatus;
  qikink_order_id?: string;
  tracking_number?: string;
  courier?: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_production"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refund_requested";

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface OnboardingState {
  step: number;
  messages: ChatMessage[];
  brandDraft: Partial<BrandDNA>;
  isComplete: boolean;
}

// Qikink catalog products (simplified)
export interface QikinkProduct {
  id: string;
  name: string;
  category: string;
  base_price: number;
  image_url: string;
  available_sizes: string[];
  available_colors: string[];
  print_areas: string[];
}
