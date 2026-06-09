// Supplier Product Template catalog.
// Each entry is a "digital twin" of a real Qikink product:
//   - real photo of the blank product (the template)
//   - print area coordinates (normalised 0–1 of template image)
//   - garment specs (sizes, colors)
// The mockup engine composites artwork onto the template at the print area.
// Templates are the source of truth — NEVER show AI-generated product images.

export interface PrintArea {
  // Normalised coords (0–1) of the template image where artwork is allowed.
  // x, y = top-left corner; w, h = size of the rectangular print area.
  x: number;
  y: number;
  w: number;
  h: number;
  // Pixel size of the production file at print DPI (used when exporting for fulfillment).
  print_px_width: number;
  print_px_height: number;
}

export interface TemplateView {
  url: string;             // template image URL
  print_area: PrintArea;
}

export interface ProductTemplate {
  id: string;
  name: string;
  category: string;
  base_price: number;       // INR
  // At least `front` is required. Some products have back/side.
  views: {
    front: TemplateView;
    back?: TemplateView;
    side?: TemplateView;
  };
  available_sizes: string[];
  available_colors: string[];
  material: string;
  description: string;
}

// Real product photos sourced from Unsplash (CC0-style mockup photography).
// In production these are replaced with Qikink's official supplier templates.
// Print areas are tuned visually for each garment type.
export const QIKINK_CATALOG: ProductTemplate[] = [
  {
    id: "QK-001",
    name: "Oversized T-Shirt",
    category: "Apparel",
    base_price: 349,
    material: "240 GSM combed cotton",
    description: "Heavyweight oversized fit. Pre-shrunk. Drop shoulder.",
    available_sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    available_colors: ["White", "Black", "Grey", "Navy", "Beige"],
    views: {
      front: {
        url: "https://pecaekbgmbuhssrwtclx.supabase.co/storage/v1/object/public/product-assets/_templates/tshirt.png",
        print_area: { x: 0.36, y: 0.30, w: 0.28, h: 0.32, print_px_width: 3600, print_px_height: 4200 },
      },
    },
  },
  {
    id: "QK-002",
    name: "Oversized Hoodie",
    category: "Apparel",
    base_price: 649,
    material: "320 GSM fleece-lined cotton blend",
    description: "Premium fleece. Kangaroo pocket. Heavyweight cotton blend.",
    available_sizes: ["S", "M", "L", "XL", "XXL"],
    available_colors: ["Black", "Grey", "White", "Navy", "Olive"],
    views: {
      front: {
        url: "https://pecaekbgmbuhssrwtclx.supabase.co/storage/v1/object/public/product-assets/_templates/hoodie.png",
        print_area: { x: 0.37, y: 0.40, w: 0.26, h: 0.19, print_px_width: 3600, print_px_height: 3000 },
      },
    },
  },
  {
    id: "QK-003",
    name: "Classic Mug (330ml)",
    category: "Drinkware",
    base_price: 199,
    material: "Ceramic, dishwasher-safe",
    description: "Standard 330ml ceramic mug. Glossy finish.",
    available_sizes: ["330ml"],
    available_colors: ["White", "Black"],
    views: {
      front: {
        url: "https://pecaekbgmbuhssrwtclx.supabase.co/storage/v1/object/public/product-assets/_templates/mug.png",
        print_area: { x: 0.31, y: 0.44, w: 0.26, h: 0.26, print_px_width: 2700, print_px_height: 2100 },
      },
    },
  },
  {
    id: "QK-004",
    name: "Tote Bag",
    category: "Accessories",
    base_price: 249,
    material: "12oz natural canvas",
    description: "Heavyweight canvas tote. Reinforced handles.",
    available_sizes: ["Standard"],
    available_colors: ["Natural", "Black", "Navy"],
    views: {
      front: {
        url: "https://pecaekbgmbuhssrwtclx.supabase.co/storage/v1/object/public/product-assets/_templates/tote.png",
        print_area: { x: 0.34, y: 0.40, w: 0.32, h: 0.32, print_px_width: 3000, print_px_height: 3000 },
      },
    },
  },
  {
    id: "QK-005",
    name: "Phone Case",
    category: "Accessories",
    base_price: 299,
    material: "Polycarbonate hard case",
    description: "Slim profile. Full-back print. Multiple iPhone models.",
    available_sizes: ["iPhone 14", "iPhone 15", "iPhone 16", "iPhone 16 Pro"],
    available_colors: ["Clear", "Black"],
    views: {
      front: {
        url: "https://pecaekbgmbuhssrwtclx.supabase.co/storage/v1/object/public/product-assets/_templates/phonecase.png",
        print_area: { x: 0.37, y: 0.18, w: 0.26, h: 0.62, print_px_width: 1800, print_px_height: 3600 },
      },
    },
  },
  {
    id: "QK-006",
    name: "Poster Print (A3)",
    category: "Home Decor",
    base_price: 199,
    material: "200 GSM matte art paper",
    description: "Museum-quality A3 print. Sharp colors. Premium paper.",
    available_sizes: ["A3", "A2"],
    available_colors: ["White"],
    views: {
      front: {
        url: "https://pecaekbgmbuhssrwtclx.supabase.co/storage/v1/object/public/product-assets/_templates/poster.png",
        print_area: { x: 0.31, y: 0.16, w: 0.38, h: 0.66, print_px_width: 3508, print_px_height: 4961 },
      },
    },
  },
  {
    id: "QK-007",
    name: "Laptop Sleeve",
    category: "Accessories",
    base_price: 399,
    material: "Neoprene with felt lining",
    description: "Shock-absorbing neoprene. Fits 13\" and 15\" laptops.",
    available_sizes: ["13\"", "15\""],
    available_colors: ["Grey", "Black", "Navy"],
    views: {
      front: {
        url: "https://pecaekbgmbuhssrwtclx.supabase.co/storage/v1/object/public/product-assets/_templates/sleeve.png",
        print_area: { x: 0.26, y: 0.34, w: 0.48, h: 0.32, print_px_width: 3600, print_px_height: 2400 },
      },
    },
  },
  {
    id: "QK-008",
    name: "Premium Polo T-Shirt",
    category: "Apparel",
    base_price: 499,
    material: "220 GSM pique cotton",
    description: "Classic polo cut. Pique knit. Mother-of-pearl buttons.",
    available_sizes: ["S", "M", "L", "XL", "XXL"],
    available_colors: ["White", "Navy", "Black", "Maroon"],
    views: {
      front: {
        url: "https://pecaekbgmbuhssrwtclx.supabase.co/storage/v1/object/public/product-assets/_templates/polo.png",
        print_area: { x: 0.38, y: 0.34, w: 0.24, h: 0.22, print_px_width: 2400, print_px_height: 2200 },
      },
    },
  },
  {
    id: "QK-009",
    name: "Sticker Sheet (A5)",
    category: "Stationery",
    base_price: 99,
    material: "Vinyl, weatherproof",
    description: "Die-cut vinyl stickers. Waterproof. UV-resistant.",
    available_sizes: ["A5"],
    available_colors: ["Glossy", "Matte"],
    views: {
      front: {
        url: "https://pecaekbgmbuhssrwtclx.supabase.co/storage/v1/object/public/product-assets/_templates/sticker.png",
        print_area: { x: 0.24, y: 0.26, w: 0.50, h: 0.48, print_px_width: 1748, print_px_height: 2480 },
      },
    },
  },
  {
    id: "QK-010",
    name: "Canvas Tote (Large)",
    category: "Accessories",
    base_price: 349,
    material: "16oz heavy canvas",
    description: "Heavyweight large canvas tote. Inside pocket.",
    available_sizes: ["Large"],
    available_colors: ["Natural", "Black"],
    views: {
      front: {
        url: "https://pecaekbgmbuhssrwtclx.supabase.co/storage/v1/object/public/product-assets/_templates/tote.png",
        print_area: { x: 0.34, y: 0.40, w: 0.32, h: 0.32, print_px_width: 3300, print_px_height: 3300 },
      },
    },
  },
];

export const CATEGORIES = [...new Set(QIKINK_CATALOG.map(p => p.category))];

export function suggestSellPrice(baseCost: number, priceTier: string): number {
  const m: Record<string, number> = { budget: 2.0, mid: 2.8, premium: 3.5, luxury: 4.5 };
  const mult = m[priceTier] || 2.8;
  return Math.ceil((baseCost * mult) / 50) * 50;
}

export function getTemplate(id: string): ProductTemplate | undefined {
  return QIKINK_CATALOG.find(p => p.id === id);
}
