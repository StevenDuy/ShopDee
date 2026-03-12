"use client";

import { useCurrencyStore } from "@/store/useCurrencyStore";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrencyStore();
  const { t } = useTranslation("common");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-9 cursor-pointer">
        <DollarSign className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle currency</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setCurrency("VND")}>
          {t("currency_vnd")} ({currency === "VND" && "✓"})
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrency("USD")}>
          {t("currency_usd")} ({currency === "USD" && "✓"})
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
