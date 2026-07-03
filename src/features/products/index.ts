/** Public API của feature `products` — xem docs/ARCHITECTURE.md §9. */
export { ProductsView } from "./components/products-view";
export { ProductFormDialog } from "./components/product-form-dialog";

export {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useBulkDeleteProducts,
} from "./hooks";

export { productKeys, productListOptions, productsApi } from "./api";

export { PRODUCT_CATEGORIES, PRODUCT_STATUSES } from "./types";
export type { Product, ProductCategory, ProductStatus, ProductListParams } from "./types";
