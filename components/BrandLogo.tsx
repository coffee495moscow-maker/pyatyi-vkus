type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  showDescriptor?: boolean;
};

/** The whisk-and-brush "В" mark from the approved brand direction. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 64 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" strokeLinecap="round" strokeWidth="1.65">
        <path d="M30 40C19 27 18 10 30 5C42 10 41 27 30 40Z" />
        <path d="M22 8C25 18 25 30 30 39M30 5V39M38 8C35 18 35 30 30 39" />
        <path d="M25 7C28 17 28 29 30 39M35 7C32 17 32 29 30 39" />
        <path d="M30 39C29 52 29 67 28 84" strokeWidth="2.2" />
        <path d="M28 47C37 39 49 42 48 49C47 56 37 58 29 58" strokeWidth="2.6" />
        <path d="M29 58C40 51 54 56 52 66C50 76 39 79 28 78" strokeWidth="2.6" />
        <path d="M27 84C25 87 27 90 29 90C32 88 31 86 28 84Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export function BrandLogo({
  compact = false,
  className = "",
  showDescriptor = true,
}: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center text-current ${className}`}>
      <BrandMark className={compact ? "h-8 w-6 shrink-0" : "h-11 w-8 shrink-0"} />
      {!compact && (
        <span className="ml-2 flex flex-col leading-none">
          <span className="font-display whitespace-nowrap text-[0.85rem] tracking-[0.28em]">
            ПЯТЫЙ ВКУС
          </span>
          {showDescriptor && (
            <span className="mt-1 text-[0.42rem] font-medium tracking-[0.28em] text-text-muted">
              ЛАБОРАТОРИЯ ДЕСЕРТОВ
            </span>
          )}
        </span>
      )}
    </span>
  );
}
