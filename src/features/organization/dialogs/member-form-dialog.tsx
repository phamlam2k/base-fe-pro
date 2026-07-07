"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { UserPicker } from "@/features/pick-user";
import {
  useCreateMember,
  useUpdateMember,
} from "@/features/organization/hooks";
import {
  createMemberFormSchema,
  type MemberFormValues,
} from "@/features/organization/schemas";
import { ORG_ROLES, type Member, type UserOption } from "@/features/organization/types";

/** Add (pick an existing user) or edit a company member's role/title. */
export function MemberFormDialog({
  open,
  onOpenChange,
  companyId,
  member,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  member?: Member | null;
}) {
  const t = useTranslations("organization");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {member ? t("members.edit") : t("members.add")}
          </DialogTitle>
          <DialogDescription>{t("members.formDescription")}</DialogDescription>
        </DialogHeader>
        <MemberForm
          key={member?.id ?? "create"}
          companyId={companyId}
          member={member}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function MemberForm({
  companyId,
  member,
  onDone,
}: {
  companyId: string;
  member?: Member | null;
  onDone: () => void;
}) {
  const t = useTranslations("organization");
  const tCommon = useTranslations("common");
  const createMember = useCreateMember(companyId);
  const updateMember = useUpdateMember();
  const isPending = createMember.isPending || updateMember.isPending;
  const isEdit = Boolean(member);

  const [picked, setPicked] = React.useState<UserOption | null>(null);

  const schema = React.useMemo(() => createMemberFormSchema(t), [t]);
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: member?.role ?? "COMPANY_MEMBER",
      customTitle: member?.customTitle ?? "",
    },
  });

  function onSubmit(values: MemberFormValues) {
    if (member) {
      updateMember.mutate({ id: member.id, input: values }, { onSuccess: onDone });
    } else {
      if (!picked) return;
      createMember.mutate(
        { userId: picked.id, role: values.role, customTitle: values.customTitle },
        { onSuccess: onDone },
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        {isEdit ? (
          <div className="grid gap-1.5">
            <Label>{t("form.person")}</Label>
            <div className="bg-muted/40 rounded-md border px-3 py-2">
              <p className="text-base font-medium">{member?.name || "—"}</p>
              <p className="text-muted-foreground text-xs">{member?.email}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-1.5">
            <Label>{t("form.person")}</Label>
            <UserPicker value={picked} onChange={setPicked} />
            <p className="text-muted-foreground text-xs">{t("form.personHint")}</p>
          </div>
        )}

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.role")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ORG_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`roles.${role}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>{t(`roleShort.${field.value}`)}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="customTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.customTitle")}</FormLabel>
              <FormControl>
                <Input placeholder={t("form.customTitlePlaceholder")} {...field} />
              </FormControl>
              <FormDescription>{t("form.customTitleHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={isPending || (!isEdit && !picked)}>
            {isPending ? <Loader2 className="animate-spin" /> : null}
            {member ? tCommon("save") : tCommon("create")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
