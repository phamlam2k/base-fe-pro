"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useNow, useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";
import { notificationApi, notificationQueries } from "@/entities/notification";

export function NotificationsBell() {
  const t = useTranslations("notifications");
  const format = useFormatter();
  // Ticking "now" so relative timestamps stay fresh while the menu is open.
  const now = useNow({ updateInterval: 60_000 });
  const queryClient = useQueryClient();

  const { data } = useQuery(notificationQueries.list());
  const markAllRead = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueries.all() }),
  });

  const unreadCount = data?.unreadCount ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t("title")}
        >
          <Bell />
          {unreadCount > 0 ? (
            <span className="bg-destructive text-destructive-foreground absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium">{t("title")}</span>
          <Button
            variant="ghost"
            size="sm"
            disabled={unreadCount === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck />
            {t("markAllRead")}
          </Button>
        </div>
        <Separator />
        <ScrollArea className="h-80">
          {data?.items.length ? (
            data.items.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "grid gap-0.5 border-b px-3 py-2.5 last:border-b-0",
                  !notification.read && "bg-accent/50",
                )}
              >
                <div className="flex items-center gap-2">
                  {!notification.read ? (
                    <span className="bg-primary size-1.5 shrink-0 rounded-full" />
                  ) : null}
                  <span className="truncate text-sm font-medium">
                    {notification.title}
                  </span>
                </div>
                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {notification.body}
                </p>
                <span className="text-muted-foreground text-[11px]">
                  {format.relativeTime(new Date(notification.createdAt), now)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground p-6 text-center text-sm">
              {t("empty")}
            </p>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
