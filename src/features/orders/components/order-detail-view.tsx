"use client";

import { ArrowLeft, ArrowRight, Ban, Loader2 } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionGate } from "@/components/shared/permission-gate";
import { ROUTES } from "@/config/routes";
import { nextStatuses } from "@/features/orders/lib";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { useOrder, useUpdateOrderStatus } from "@/features/orders/hooks";
import { isApiError } from "@/lib/api/axios";
import type { OrderStatus } from "@/features/orders/types";

export function OrderDetailView({ orderId }: { orderId: string }) {
  const t = useTranslations("orders");
  const format = useFormatter();
  const orderQuery = useOrder(orderId);
  const updateStatus = useUpdateOrderStatus();

  if (orderQuery.isPending) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (orderQuery.isError) {
    const notFound =
      isApiError(orderQuery.error) && orderQuery.error.status === 404;
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            {notFound ? t("notFound") : orderQuery.error.message}
          </p>
          <Button variant="outline" asChild>
            <Link href={ROUTES.orders}>
              <ArrowLeft />
              {t("backToOrders")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const order = orderQuery.data;
  const currency = (value: number) =>
    format.number(value, { style: "currency", currency: "USD" });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href={ROUTES.orders} aria-label={t("backToOrders")}>
            <ArrowLeft />
          </Link>
        </Button>
        <h2 className="font-mono text-lg font-semibold">{order.code}</h2>
        <OrderStatusBadge status={order.status} />

        <PermissionGate permission="orders:update">
          <div className="ml-auto flex items-center gap-2">
            {nextStatuses(order.status).map((status) => (
              <StatusActionButton
                key={status}
                status={status}
                isPending={updateStatus.isPending}
                onClick={() =>
                  updateStatus.mutate({ id: order.id, status })
                }
              />
            ))}
          </div>
        </PermissionGate>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="items">
            {t("tabs.items", { count: order.items.length })}
          </TabsTrigger>
          <TabsTrigger value="timeline">{t("tabs.timeline")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>{t("customer")}</CardTitle>
              <CardDescription>
                {format.dateTime(new Date(order.createdAt), {
                  dateStyle: "long",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1">
                <span className="text-muted-foreground text-sm">{t("customer")}</span>
                <span className="font-medium">{order.customerName}</span>
                <span className="text-muted-foreground text-sm">
                  {order.customerEmail}
                </span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground text-sm">{t("total")}</span>
                <span className="text-2xl font-semibold tabular-nums">
                  {currency(order.total)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("product")}</TableHead>
                    <TableHead className="text-right">{t("quantity")}</TableHead>
                    <TableHead className="text-right">{t("unitPrice")}</TableHead>
                    <TableHead className="text-right">{t("lineTotal")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.productName}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {currency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {currency(item.unitPrice * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator className="my-4" />
              <div className="flex justify-end gap-8 text-sm">
                <span className="text-muted-foreground">{t("total")}</span>
                <span className="font-semibold tabular-nums">
                  {currency(order.total)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="grid gap-0 pt-6">
              {[...order.timeline].reverse().map((entry, index, all) => (
                <div key={`${entry.status}-${entry.at}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="bg-primary mt-1.5 size-2.5 shrink-0 rounded-full" />
                    {index < all.length - 1 ? (
                      <span className="bg-border w-px flex-1" />
                    ) : null}
                  </div>
                  <div className="grid gap-0.5 pb-6">
                    <OrderStatusBadge status={entry.status} />
                    <span className="text-muted-foreground text-xs">
                      {format.dateTime(new Date(entry.at), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {" · "}
                      {entry.by}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusActionButton({
  status,
  isPending,
  onClick,
}: {
  status: OrderStatus;
  isPending: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("orders");
  const isCancel = status === "cancelled";

  return (
    <Button
      variant={isCancel ? "outline" : "default"}
      size="sm"
      disabled={isPending}
      onClick={onClick}
    >
      {isPending ? (
        <Loader2 className="animate-spin" />
      ) : isCancel ? (
        <Ban />
      ) : (
        <ArrowRight />
      )}
      {t(`actions.${status}`)}
    </Button>
  );
}
