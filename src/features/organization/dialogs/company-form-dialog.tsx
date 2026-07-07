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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { useCreateCompany } from "@/features/organization/hooks";
import {
  createCompanyFormSchema,
  type CompanyFormValues,
} from "@/features/organization/schemas";

/** Create a new company (platform / SuperAdmin action). */
export function CompanyFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("organization");
  const tCommon = useTranslations("common");
  const createCompany = useCreateCompany();

  const schema = React.useMemo(() => createCompanyFormSchema(t), [t]);
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", status: "ACTIVE" },
  });

  function onSubmit(values: CompanyFormValues) {
    createCompany.mutate(values, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{t("companies.add")}</DialogTitle>
          <DialogDescription>{t("companies.formDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.companyName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.companyNamePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createCompany.isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={createCompany.isPending}>
                {createCompany.isPending ? <Loader2 className="animate-spin" /> : null}
                {tCommon("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
