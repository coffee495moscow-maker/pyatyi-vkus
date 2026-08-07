"use client";

import { cn } from "@/lib/utils";

export interface PillOption {
  value: string;
  label: string;
}

export function CategoryPills({
  options,
  value,
  onChange,
}: {
  options: PillOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "pill border px-4 py-2 text-sm transition-colors",
              active
                ? "border-accent bg-accent text-accent-contrast"
                : "border-border text-text-muted hover:border-accent hover:text-accent",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
