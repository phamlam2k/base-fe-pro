"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { UserFormDialog } from "@/features/manage-user";
import { userQueries, type User } from "@/entities/user";
import type { Company } from "@/entities/company";

/**
 * SuperAdmin xem/quản lý tài khoản Admin (COMPANY_ADMIN) của 1 công ty: liệt kê +
 * mở form sửa (đổi trạng thái / reset mật khẩu) cho từng admin.
 */
export function CompanyAdminsDialog({
  open,
  onOpenChange,
  company,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
}) {
  const t = useTranslations("organization");
  const [editUser, setEditUser] = React.useState<User | null>(null);

  const adminsQuery = useQuery({
    ...userQueries.list({
      page: 1,
      pageSize: 50,
      company: company.id,
      companyRole: "COMPANY_ADMIN",
    }),
    enabled: open,
  });
  const admins = adminsQuery.data?.items ?? [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t("companies.adminsTitle", { name: company.name })}
            </DialogTitle>
            <DialogDescription>{t("companies.adminsHint")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            {adminsQuery.isPending ? (
              <p className="text-sm text-muted-foreground">{t("companies.loading")}</p>
            ) : admins.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("companies.noAdmins")}
              </p>
            ) : (
              admins.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!u.isActive ? (
                      <Badge variant="secondary">{t("companies.inactive")}</Badge>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditUser(u)}
                    >
                      <Pencil className="size-4" />
                      {t("companies.editAdmin")}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <UserFormDialog
        open={Boolean(editUser)}
        onOpenChange={(o) => !o && setEditUser(null)}
        user={editUser}
      />
    </>
  );
}
