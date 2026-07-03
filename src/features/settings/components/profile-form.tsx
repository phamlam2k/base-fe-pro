"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/providers/session-provider";

export function ProfileForm() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const { user } = useSession();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const schema = React.useMemo(
    () =>
      z.object({
        name: z.string().min(2, { message: t("validation.nameMin") }),
        bio: z.string().max(240, { message: t("validation.bioMax") }),
      }),
    [t],
  );

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name, bio: "" },
  });

  async function onSubmit() {
    setIsSubmitting(true);
    // Mock persistence — wire to PATCH /users/:id (or /auth/me) in real apps.
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSubmitting(false);
    toast.success(t("profileUpdated"));
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{t("profileTitle")}</CardTitle>
        <CardDescription>{t("profileDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("profileName")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>{t("profileEmail")}</FormLabel>
              <Input value={user.email} disabled />
              <FormDescription>{t("profileEmailNote")}</FormDescription>
            </FormItem>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("profileBio")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("profileBioPlaceholder")}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="justify-self-start"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              {isSubmitting ? tCommon("saving") : tCommon("save")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
