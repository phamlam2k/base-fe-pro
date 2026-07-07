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
import { useCreateProject, useUpdateProject } from "../model/hooks";
import {
  createProjectFormSchema,
  type ProjectFormValues,
} from "@/entities/project";
import type { Project } from "@/entities/project";

/** Create + edit a project in one dialog (`project` present → edit). */
export function ProjectFormDialog({
  open,
  onOpenChange,
  companyId,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  project?: Project | null;
}) {
  const t = useTranslations("organization");
  const tCommon = useTranslations("common");
  const createProject = useCreateProject(companyId);
  const updateProject = useUpdateProject();
  const isPending = createProject.isPending || updateProject.isPending;

  const schema = React.useMemo(() => createProjectFormSchema(t), [t]);
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: project?.name ?? "" },
  });

  React.useEffect(() => {
    if (open) form.reset({ name: project?.name ?? "" });
  }, [open, project, form]);

  function onSubmit(values: ProjectFormValues) {
    if (project) {
      updateProject.mutate(
        { id: project.id, input: values },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createProject.mutate(values, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {project ? t("projects.edit") : t("projects.add")}
          </DialogTitle>
          <DialogDescription>{t("projects.formDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.projectName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.projectNamePlaceholder")} {...field} />
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
                disabled={isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : null}
                {project ? tCommon("save") : tCommon("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
