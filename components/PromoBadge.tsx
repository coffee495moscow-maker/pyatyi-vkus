import { cn } from "@/lib/utils";

export function PromoBadge({
  children,
  variant = "hit",
  className,
}: {
  children: React.ReactNode;
  variant?: "hit" | "new";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "pill absolute left-3 top-3 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
        variant === "hit"
          ? "bg-accent text-accent-contrast"
          : "bg-surface-elevated text-accent border border-accent/50",
        className,
      )}
    >
      {children}
    </span>
  );
}
