/** Public API của feature `orders` — xem docs/ARCHITECTURE.md §9. */
export { OrdersView } from "./components/orders-view";
export { OrderDetailView } from "./components/order-detail-view";
export { OrderStatusBadge } from "./components/order-status-badge";

export { useOrders, useOrder, useUpdateOrderStatus } from "./hooks";

export { orderKeys, orderListOptions, orderDetailOptions, ordersApi } from "./api";

export { canTransition, nextStatuses, isTerminal } from "./lib";

export { ORDER_STATUSES } from "./types";
export type { Order, OrderItem, OrderStatus, OrderListParams } from "./types";
