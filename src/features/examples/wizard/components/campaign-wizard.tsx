"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  CAMPAIGN_LOCATIONS,
  CAMPAIGN_OBJECTIVES,
  createWizardSchemas,
  type WizardAudience,
  type WizardBasics,
  type WizardReview,
} from "@/features/examples/wizard/schemas";
import {
  WIZARD_STEPS,
  useWizardStore,
  type WizardStep,
} from "@/features/examples/wizard/store";

function Stepper({ current }: { current: WizardStep }) {
  const t = useTranslations("wizard");
  const currentIndex = WIZARD_STEPS.indexOf(current);

  return (
    <ol className="flex items-center gap-2">
      {WIZARD_STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <React.Fragment key={step}>
            {index > 0 ? <Separator className="w-8 flex-none" /> : null}
            <li className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  done && "bg-primary text-primary-foreground",
                  active && "border-primary text-primary border-2",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-sm",
                  active ? "font-medium" : "text-muted-foreground",
                )}
              >
                {t(`steps.${step}`)}
              </span>
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  );
}

export function CampaignWizard() {
  const t = useTranslations("wizard");
  const { step } = useWizardStore();

  return (
    <Card className="max-w-2xl">
      <CardHeader className="gap-4">
        <Stepper current={step} />
        <div>
          <CardTitle>{t(`steps.${step}`)}</CardTitle>
          <CardDescription className="mt-1">
            {t(`stepDescriptions.${step}`)}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {step === "basics" ? <BasicsStep /> : null}
        {step === "audience" ? <AudienceStep /> : null}
        {step === "review" ? <ReviewStep /> : null}
      </CardContent>
    </Card>
  );
}

function BasicsStep() {
  const t = useTranslations("wizard");
  const { draft, patchDraft, setStep } = useWizardStore();

  const schema = React.useMemo(() => createWizardSchemas(t).basics, [t]);
  const form = useForm<WizardBasics>({
    resolver: zodResolver(schema),
    defaultValues: { name: draft.name, objective: draft.objective },
  });

  function onSubmit(values: WizardBasics) {
    patchDraft(values);
    setStep("audience");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6" noValidate>
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
          name="objective"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("objective")}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid gap-2"
                >
                  {CAMPAIGN_OBJECTIVES.map((objective) => (
                    <FormItem key={objective} className="flex items-center gap-2">
                      <FormControl>
                        <RadioGroupItem value={objective} />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {t(`objectives.${objective}`)}
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="justify-self-end">
          {t("next")}
          <ArrowRight />
        </Button>
      </form>
    </Form>
  );
}

function AudienceStep() {
  const t = useTranslations("wizard");
  const { draft, patchDraft, setStep } = useWizardStore();

  const schema = React.useMemo(() => createWizardSchemas(t).audience, [t]);
  const form = useForm<WizardAudience>({
    resolver: zodResolver(schema),
    defaultValues: {
      locations: draft.locations,
      dailyBudget: draft.dailyBudget,
    },
  });

  function onSubmit(values: WizardAudience) {
    patchDraft(values);
    setStep("review");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6" noValidate>
        <FormField
          control={form.control}
          name="locations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("locations")}</FormLabel>
              <div className="grid gap-2">
                {CAMPAIGN_LOCATIONS.map((location) => {
                  const checked = field.value.includes(location);
                  return (
                    <FormItem key={location} className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) =>
                            field.onChange(
                              next
                                ? [...field.value, location]
                                : field.value.filter((v) => v !== location),
                            )
                          }
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {t(`locationLabels.${location}`)}
                      </FormLabel>
                    </FormItem>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dailyBudget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("dailyBudget")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  className="max-w-40"
                  value={Number.isNaN(field.value) ? "" : field.value}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === ""
                        ? Number.NaN
                        : event.target.valueAsNumber,
                    )
                  }
                />
              </FormControl>
              <FormDescription>{t("dailyBudgetDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => setStep("basics")}>
            <ArrowLeft />
            {t("back")}
          </Button>
          <Button type="submit">
            {t("next")}
            <ArrowRight />
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ReviewStep() {
  const t = useTranslations("wizard");
  const format = useFormatter();
  const { draft, patchDraft, setStep, reset } = useWizardStore();

  const schema = React.useMemo(() => createWizardSchemas(t).review, [t]);
  const form = useForm<WizardReview>({
    resolver: zodResolver(schema),
    defaultValues: { terms: draft.terms },
  });

  function onSubmit(values: WizardReview) {
    patchDraft(values);
    toast.success(t("submitted"), { description: draft.name });
    reset();
  }

  const summary = [
    { label: t("name"), value: draft.name },
    { label: t("objective"), value: t(`objectives.${draft.objective}`) },
    {
      label: t("locations"),
      value: draft.locations
        .map((location) => t(`locationLabels.${location}`))
        .join(", "),
    },
    {
      label: t("dailyBudget"),
      value: Number.isNaN(draft.dailyBudget)
        ? "—"
        : format.number(draft.dailyBudget, {
            style: "currency",
            currency: "USD",
          }),
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6" noValidate>
        <dl className="grid gap-3 rounded-lg border p-4">
          {summary.map((row) => (
            <div key={row.label} className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>

        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">{t("terms")}</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep("audience")}
          >
            <ArrowLeft />
            {t("back")}
          </Button>
          <Button type="submit">
            <Check />
            {t("submit")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
