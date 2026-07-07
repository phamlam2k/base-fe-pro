"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { useDebounce } from "@/shared/lib/use-debounce";
import { cn } from "@/shared/lib/utils";
import { useUserLookup } from "@/features/organization/hooks";
import type { UserOption } from "@/features/organization/types";

/**
 * Search-and-pick an EXISTING user account (id/name/email). Replaces raw email
 * entry so members are always real, login-capable accounts. Search runs
 * server-side (debounced) against /organization/users/lookup.
 */
export function UserPicker({
  value,
  onChange,
  disabled,
}: {
  value: UserOption | null;
  onChange: (user: UserOption) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("organization");
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const debounced = useDebounce(search);
  const query = useUserLookup(debounced);
  const users = query.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {value ? (
            <span className="truncate">
              {value.name || value.email}
              {value.name ? (
                <span className="text-muted-foreground"> · {value.email}</span>
              ) : null}
            </span>
          ) : (
            <span className="text-muted-foreground">{t("picker.placeholder")}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={t("picker.searchPlaceholder")}
          />
          <CommandList>
            {query.isFetching && users.length === 0 ? (
              <div className="text-muted-foreground p-3 text-sm">
                {t("picker.loading")}
              </div>
            ) : users.length === 0 ? (
              <div className="text-muted-foreground p-3 text-sm">
                {t("picker.empty")}
              </div>
            ) : (
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => {
                      onChange(user);
                      setOpen(false);
                    }}
                  >
                    <div className="grid">
                      <span className="font-medium">{user.name || "—"}</span>
                      <span className="text-muted-foreground text-xs">{user.email}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto size-4",
                        value?.id === user.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
