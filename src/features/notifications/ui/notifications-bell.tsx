"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { useSelectedProjectStore } from "@/shared/lib/selected-project";
import {
  notificationApi,
  notificationQueries,
  resolveNotificationHref,
  type Notification,
} from "@/entities/notification";

export function NotificationsBell() {
  const t = useTranslations("notifications");
  const format = useFormatter();
  const router = useRouter();
  // Ticking "now" so relative timestamps stay fresh while the menu is open.
  const now = useNow({ updateInterval: 60_000 });
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  // Badge: poll nhẹ số chưa đọc. List: chỉ tải khi mở dropdown. Lọc theo dự án đang chọn.
  const projectId = useSelectedProjectStore((s) => s.selectedProjectId);
  const setSelectedProjectId = useSelectedProjectStore(
    (s) => s.setSelectedProjectId,
  );
  const { data: unreadCount = 0 } = useQuery(
    notificationQueries.unreadCount(projectId ?? undefined),
  );
  const { data: items = [] } = useQuery({
    ...notificationQueries.list(projectId ?? undefined),
    enabled: open,
  });
  const markAllRead = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueries.all() }),
  });
  const markRead = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueries.all() }),
  });

  // Bấm thông báo → đánh dấu đã đọc + ĐỔI sang dự án của thông báo (nếu khác dự án
  // đang chọn) rồi điều hướng theo registry → chi tiết đi đúng luồng dự án đó.
  const onSelect = (notification: Notification) => {
    if (!notification.read) markRead.mutate(notification.id);
    if (notification.projectId && notification.projectId !== projectId) {
      setSelectedProjectId(notification.projectId);
    }
    const href = resolveNotificationHref(notification);
    if (href) {
      setOpen(false);
      router.push(href);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
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
          {items.length ? (
            items.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => onSelect(notification)}
                className={cn(
                  "hover:bg-accent grid w-full gap-0.5 border-b px-3 py-2.5 text-left last:border-b-0",
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
                {notification.projectName ? (
                  <span className="bg-muted text-muted-foreground w-fit rounded px-1.5 py-0.5 text-[10px] font-medium">
                    {notification.projectName}
                  </span>
                ) : null}
                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {notification.body}
                </p>
                <span className="text-muted-foreground text-[11px]">
                  {format.relativeTime(new Date(notification.createdAt), now)}
                </span>
              </button>
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
