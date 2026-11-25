"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import {
  useCreateUser,
  useResetPassword,
  useUpdateUser,
} from "@/features/manage-user/model/hooks";
import {
  ACCOUNT_ROLES,
  COMPANY_ROLES,
  createUserFormSchema,
  type UserFormValues,
} from "@/entities/user";
import type { User } from "@/entities/user";
import { companyQueries } from "@/entities/company";
import { useSession } from "@/entities/session";

/**
 * Create + edit a platform user in one dialog. `user` present → edit mode
 * (email locked, password optional). The inner form remounts via `key`.
 *
 * MAD-36: khi tạo, Admin chỉ chọn vai trò — mật khẩu do hệ thống tự sinh và hiển
 * thị 1 lần sau khi tạo. Edit mode có thêm nút "Reset mật khẩu".
 */
/** Preset khi tạo user từ 1 ngữ cảnh cố định (vd SuperAdmin "Tạo Admin" cho 1 công ty). */
export interface UserFormPreset {
  companyId?: string;
  companyName?: string;
  companyRole?: string; // vd "COMPANY_ADMIN"
  lockCompany?: boolean;
  lockCompanyRole?: boolean;
  title?: string;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  preset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  preset?: UserFormPreset;
}) {
  const t = useTranslations("users");
  const title = user ? t("editUser") : (preset?.title ?? t("addUser"));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>
        <UserForm
          key={user?.id ?? preset?.companyId ?? "create"}
          user={user}
          preset={preset}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

/** Ô hiển thị mật khẩu tự sinh kèm nút sao chép (chỉ hiện 1 lần). */
function GeneratedPasswordPanel({ password }: { password: string }) {
  const t = useTranslations("users");
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard bị chặn — người dùng tự chép tay */
    }
  };
  return (
    <div className="grid gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
      <p className="text-sm font-medium">{t("generatedTitle")}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded bg-background px-2 py-1 font-mono text-sm">
          {password}
        </code>
        <Button type="button" size="icon" variant="outline" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("generatedHint")}</p>
    </div>
  );
}

function UserForm({
  user,
  preset,
  onDone,
}: {
  user?: User | null;
  preset?: UserFormPreset;
  onDone: () => void;
}) {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const resetPassword = useResetPassword();
  const isPending =
    createUser.isPending || updateUser.isPending || resetPassword.isPending;
  const isEdit = Boolean(user);

  const { user: sessionUser } = useSession();
  const isSuperAdmin = sessionUser.role === "admin";
  const hasPresetCompany = Boolean(preset?.companyId);
  // Tạo Admin công ty (SuperAdmin, preset COMPANY_ADMIN): form gọn — KHÔNG cần chức
  // vụ / vai trò nghiệp vụ / công tắc SuperAdmin (đây là Admin CÔNG TY, không phải
  // SuperAdmin nền tảng). Vai trò nghiệp vụ mặc định "admin" để qua validate.
  const isCompanyAdminPreset =
    !isEdit && preset?.companyRole === "COMPANY_ADMIN";
  // SuperAdmin chọn công ty (khi tạo tự do). Company Admin: backend tự gán công ty
  // họ → ta chỉ HIỂN THỊ read-only tên công ty. Có preset (Tạo Admin) → khoá công ty.
  const companiesQuery = useQuery({
    ...companyQueries.list({ page: 1, pageSize: 100 }),
    enabled: !isEdit && isSuperAdmin && !hasPresetCompany,
  });
  const companies = companiesQuery.data?.items ?? [];
  // Company Admin: tên công ty của chính họ (danh sách chỉ có 1) để hiện read-only.
  const ownCompanyQuery = useQuery({
    ...companyQueries.list({ page: 1, pageSize: 1 }),
    enabled: !isEdit && !isSuperAdmin && !hasPresetCompany,
  });
  const ownCompanyName = ownCompanyQuery.data?.items?.[0]?.name ?? "";
  // Vai trò nghiệp vụ: manager KHÔNG cấp được "Quản trị hệ thống".
  const roleOptions = isSuperAdmin
    ? ACCOUNT_ROLES
    : ACCOUNT_ROLES.filter((r) => r !== "admin");

  // Mật khẩu tự sinh cần hiển thị (sau tạo mới hoặc reset). Khi có giá trị này,
  // dialog chuyển sang trạng thái "hãy sao chép" thay vì đóng ngay.
  const [generatedPassword, setGeneratedPassword] = React.useState<
    string | null
  >(null);

  const schema = React.useMemo(() => createUserFormSchema(t), [t]);
  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      position: user?.position ?? "",
      phone: user?.phone ?? "",
      role: user?.role || (isCompanyAdminPreset ? "admin" : undefined),
      isSuperAdmin: user?.isSuperAdmin ?? false,
      isActive: user?.isActive ?? true,
      company: preset?.companyId ?? undefined,
      companyRole:
        (preset?.companyRole as UserFormValues["companyRole"]) ?? undefined,
      password: "",
    },
  });

  function onSubmit(values: UserFormValues) {
    if (user) {
      // Drop a blank password so an edit keeps the current one.
      const payload = { ...values };
      if (!payload.password) delete payload.password;
      updateUser.mutate({ id: user.id, input: payload }, { onSuccess: onDone });
    } else {
      // MAD-36: không gửi password khi tạo → backend tự sinh & trả về 1 lần.
      const { password: _drop, ...payload } = values;
      createUser.mutate(payload, {
        onSuccess: (created) => {
          if (created.generatedPassword) {
            setGeneratedPassword(created.generatedPassword);
          } else {
            onDone();
          }
        },
      });
    }
  }

  // Sau khi tạo/reset và đã có mật khẩu để bàn giao: chỉ hiện panel + nút Đóng.
  if (generatedPassword) {
    return (
      <div className="grid gap-4">
        <GeneratedPasswordPanel password={generatedPassword} />
        <DialogFooter>
          <Button type="button" onClick={onDone}>
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@company.vn"
                      disabled={isEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isCompanyAdminPreset ? (
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("position")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("positionPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("phone")}</FormLabel>
                  <FormControl>
                    <Input placeholder="09xx xxx xxx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isCompanyAdminPreset ? (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("role")}</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("rolePlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((r) => (
                          <SelectItem key={r} value={r}>
                            {t(`role_${r}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {/* Công ty: (1) preset khoá → read-only; (2) SuperAdmin tạo tự do → chọn;
                (3) Company Admin → read-only tên công ty của họ (backend tự gán). */}
            {!isEdit && hasPresetCompany ? (
              <FormItem>
                <FormLabel>{t("company")}</FormLabel>
                <Input value={preset?.companyName ?? ""} disabled readOnly />
              </FormItem>
            ) : !isEdit && isSuperAdmin ? (
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("company")}</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("companyPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("companyHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : !isEdit ? (
              <FormItem>
                <FormLabel>{t("company")}</FormLabel>
                <Input value={ownCompanyName} disabled readOnly />
                <FormDescription>{t("companyOwnHint")}</FormDescription>
              </FormItem>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            {/* Vai trò trong công ty. Khoá (Tạo Admin) → hiện read-only, không cho đổi. */}
            {!isEdit && preset?.lockCompanyRole ? (
              <FormItem>
                <FormLabel>{t("companyRole")}</FormLabel>
                <Input
                  value={t(`companyRole_${preset.companyRole ?? "COMPANY_ADMIN"}`)}
                  disabled
                  readOnly
                />
              </FormItem>
            ) : !isEdit ? (
              <FormField
                control={form.control}
                name="companyRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("companyRole")}</FormLabel>
                    <Select
                      value={field.value ?? "COMPANY_MEMBER"}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMPANY_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {t(`companyRole_${r}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t("companyRoleHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {isEdit ? (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("password")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>{t("passwordEditHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                {t("passwordAutoGenHint")}
              </p>
            )}

            {/* Công tắc SuperAdmin nền tảng: chỉ SuperAdmin thấy; ẩn khi đang tạo
                Admin CÔNG TY (đây là admin công ty, không phải SuperAdmin nền tảng). */}
            {isSuperAdmin && !isCompanyAdminPreset ? (
              <FormField
                control={form.control}
                name="isSuperAdmin"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="grid gap-0.5">
                      <FormLabel>{t("superAdmin")}</FormLabel>
                      <FormDescription>{t("superAdminHint")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="grid gap-0.5">
                    <FormLabel>{t("activeAccount")}</FormLabel>
                    <FormDescription>{t("activeHint")}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between mt-3">
          {isEdit ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                resetPassword.mutate(user!.id, {
                  onSuccess: (res) =>
                    setGeneratedPassword(res.generatedPassword),
                })
              }
            >
              <KeyRound className="size-4" />
              {t("resetPassword")}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onDone}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : null}
              {user ? tCommon("save") : tCommon("create")}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}
