"use client";

import * as React from "react";
import { Check, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/shared/config/i18n/config";
import { setUserLocale } from "@/shared/config/i18n/actions";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function handleSelect(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setUserLocale(next);
      // Re-render server components with the new locale cookie.
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Change language"
          disabled={isPending}
        >
          <Languages />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((candidate) => (
          <DropdownMenuItem
            key={candidate}
            onClick={() => handleSelect(candidate)}
          >
            {LOCALE_LABELS[candidate]}
            {candidate === locale ? <Check className="ml-auto" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
