"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { PermissionGate } from "@/entities/session";
// CROSS-FEATURE REFERENCE EXAMPLE (docs/ARCHITECTURE.md §9):
// dashboard (composite) uses the `users` core feature — ONLY via its public
// API. Deep imports like "@/features/users/components/..." are an ESLint error.
import { UserFormDialog, type User } from "@/features/users";
import { dashboardKeys } from "@/features/dashboard/api";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function RecentUsers({
  users,
  isLoading,
}: {
  users?: User[];
  isLoading: boolean;
}) {
  const t = useTranslations("dashboard");
  const tUsers = useTranslations("users");
  const format = useFormatter();
  const queryClient = useQueryClient();
  const [userToEdit, setUserToEdit] = React.useState<User | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recentUsersTitle")}</CardTitle>
        <CardDescription>{t("recentUsersDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="grid flex-1 gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
            ))
          : (users ?? []).map((user) => (
              <div key={user.id} className="group flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="text-xs">
                    {initialsOf(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {format.dateTime(new Date(user.createdAt), {
                    dateStyle: "medium",
                  })}
                </span>
                <PermissionGate permission="users:update">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label={tUsers("editUser")}
                    onClick={() => setUserToEdit(user)}
                  >
                    <Pencil />
                  </Button>
                </PermissionGate>
              </div>
            ))}
      </CardContent>

      <UserFormDialog
        open={userToEdit !== null}
        onOpenChange={(open) => {
          if (!open) {
            setUserToEdit(null);
            // The users feature already refreshes its own cache; the
            // dashboard aggregate is ours to refresh.
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
          }
        }}
        user={userToEdit}
      />
    </Card>
  );
}
