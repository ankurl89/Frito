import { QikinkProduct } from "./types";

// Curated Qikink catalog — real product categories and base prices (INR)
// In production, fetch live from Qikink API
export const QIKINK_CATALOG: QikinkProduct[] = [
  {
    id: "QK-001",
    name: "Oversized T-Shirt",
    category: "Apparel",
    base_price: 349,
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
    available_sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    available_colors: ["White", "Black", "Grey", "Navy", "Beige"],
    print_areas: ["Front", "Back"],
  },
  {
    id: "QK-002",
    name: "Oversized Hoodie",
    category: "Apparel",
    base_price: 649,
    image_url: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80",
    available_sizes: ["S", "M", "L", "XL", "XXL"],
    available_colors: ["Black", "Grey", "White", "Navy", "Olive"],
    print_areas: ["Front", "Back"],
  },
  {
    id: "QK-003",
    name: "Classic Mug (330ml)",
    category: "Drinkware",
    base_price: 199,
    image_url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80",
    available_sizes: ["330ml"],
    available_colors: ["White", "Black"],
    print_areas: ["Wrap"],
  },
  {
    id: "QK-004",
    name: "Tote Bag",
    category: "Accessories",
    base_price: 249,
    image_url: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&q=80",
    available_sizes: ["Standard"],
    available_colors: ["Natural", "Black", "Navy"],
    print_areas: ["Front", "Back"],
  },
  {
    id: "QK-005",
    name: "Phone Case (All iPhones)",
    category: "Accessories",
    base_price: 299,
    image_url: "https://images.unsplash.com/photo-1601593346740-925612772716?w=400&q=80",
    available_sizes: ["iPhone 14", "iPhone 15", "iPhone 16", "iPhone 16 Pro"],
    available_colors: ["Clear", "Black"],
    print_areas: ["Back"],
  },
  {
    id: "QK-006",
    name: "Poster Print (A3)",
    category: "Home Decor",
    base_price: 199,
    image_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80",
    available_sizes: ["A3", "A2"],
    available_colors: ["White"],
    print_areas: ["Full Print"],
  },
  {
    id: "QK-007",
    name: "Laptop Sleeve (15\")",
    category: "Accessories",
    base_price: 399,
    image_url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&q=80",
    available_sizes: ["13\"", "15\""],
    available_colors: ["Grey", "Black", "Navy"],
    print_areas: ["Front"],
  },
  {
    id: "QK-008",
    name: "Premium Polo T-Shirt",
    category: "Apparel",
    base_price: 499,
    image_url: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400&q=80",
    available_sizes: ["S", "M", "L", "XL", "XXL"],
    available_colors: ["White", "Navy", "Black", "Maroon"],
    print_areas: ["Chest", "Back"],
  },
  {
    id: "QK-009",
    name: "Sticker Sheet (A5)",
    category: "Stationery",
    base_price: 99,
    image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    available_sizes: ["A5"],
    available_colors: ["Glossy", "Matte"],
    print_areas: ["Full Sheet"],
  },
  {
    id: "QK-010",
    name: "Canvas Tote (Large)",
    category: "Accessories",
    base_price: 349,
    image_url: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&q=80",
    available_sizes: ["Large"],
    available_colors: ["Natural", "Black"],
    print_areas: ["Front"],
  },
];

export const CATEGORIES = [...new Set(QIKINK_CATALOG.map(p => p.category))];

// Suggested sell price = base_price * markup (2.5–3.5x based on price tier)
export function suggestSellPrice(baseCost: number, priceTier: string): number {
  const multipliers: Record<string, number> = {
    budget: 2.0,
    mid: 2.8,
    premium: 3.5,
    luxury: 4.5,
  };
  const m = multipliers[priceTier] || 2.8;
  return Math.ceil((baseCost * m) / 50) * 50; // Round to nearest ₹50
}
