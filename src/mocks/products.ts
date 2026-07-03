import "server-only";

/** In-memory products table for the mock API. See src/mocks/db.ts for the approach. */

export type ProductStatus = "active" | "draft" | "archived";
export type ProductCategory =
  | "electronics"
  | "apparel"
  | "home"
  | "beauty"
  | "sports";

export interface DbProduct {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  price: number;
  stock: number;
  status: ProductStatus;
  createdAt: string;
}

const CATEGORIES: ProductCategory[] = [
  "electronics",
  "apparel",
  "home",
  "beauty",
  "sports",
];

const ADJECTIVES = [
  "Aurora", "Nimbus", "Vertex", "Echo", "Zenith", "Pulse", "Orbit", "Nova",
  "Drift", "Ember", "Frost", "Titan",
];
const NOUNS = [
  "Headphones", "Backpack", "Lamp", "Sneakers", "Serum", "Keyboard",
  "Bottle", "Jacket", "Monitor", "Mat",
];

const SEED_BASE_MS = Date.UTC(2026, 5, 30);
const DAY_MS = 24 * 60 * 60 * 1000;

function seedProducts(): DbProduct[] {
  return Array.from({ length: 57 }, (_, i) => {
    const adjective = ADJECTIVES[(i * 5 + 2) % ADJECTIVES.length];
    const noun = NOUNS[(i * 3 + 1) % NOUNS.length];
    const status: ProductStatus =
      i % 9 === 0 ? "archived" : i % 4 === 0 ? "draft" : "active";
    return {
      id: `prd_${String(i + 1).padStart(3, "0")}`,
      name: `${adjective} ${noun}`,
      sku: `${adjective.slice(0, 3).toUpperCase()}-${noun.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
      category: CATEGORIES[(i * 7 + 3) % CATEGORIES.length],
      price: Math.round((19 + ((i * 37) % 480) + (i % 3) * 0.5) * 100) / 100,
      stock: (i * 13) % 250,
      status,
      createdAt: new Date(SEED_BASE_MS - Math.round(i * 5.1 * DAY_MS)).toISOString(),
    };
  });
}

interface ProductsStore {
  products: DbProduct[];
  nextId: number;
}

const globalStore = globalThis as unknown as { __mockProducts?: ProductsStore };

export function getProductsDb(): ProductsStore {
  if (!globalStore.__mockProducts) {
    const products = seedProducts();
    globalStore.__mockProducts = { products, nextId: products.length + 1 };
  }
  return globalStore.__mockProducts;
}

export function allocateProductId(): string {
  const db = getProductsDb();
  return `prd_${String(db.nextId++).padStart(3, "0")}`;
}
