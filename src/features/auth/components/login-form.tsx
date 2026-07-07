"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { isApiError } from "@/shared/api/axios";
import { useLogin } from "@/features/auth/hooks";
import { createLoginSchema, type LoginValues } from "@/features/auth/schemas";

const DEMO_ACCOUNTS = [
  { email: "admin@acme.io", role: "Admin" },
  { email: "manager@acme.io", role: "Manager" },
  { email: "viewer@acme.io", role: "Viewer" },
];

export function LoginForm() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? undefined;
  const login = useLogin(redirectTo);

  const schema = React.useMemo(() => createLoginSchema(t), [t]);
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginValues) {
    login.mutate(values);
  }

  const serverError =
    login.error && isApiError(login.error) ? login.error.message : null;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t("loginTitle")}</CardTitle>
        <CardDescription>{t("loginSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" disabled={login.isPending}>
              {login.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </form>
        </Form>

        <div className="text-muted-foreground text-sm">
          <p className="mb-2 font-medium">
            {t("demoAccounts", { password: "Demo@123" })}
          </p>
          <ul className="grid gap-1">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  className="hover:text-foreground underline underline-offset-4"
                  onClick={() => {
                    form.setValue("email", account.email);
                    form.setValue("password", "Demo@123");
                  }}
                >
                  {account.email}
                </button>{" "}
                — {account.role}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
