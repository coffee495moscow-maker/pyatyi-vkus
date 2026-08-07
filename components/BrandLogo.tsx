import Image from "next/image";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  showDescriptor?: boolean;
};

/** Exact brand mark supplied by the client. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/brand/pyatyi-vkus-mark.jpg"
      alt=""
      aria-hidden="true"
      width={162}
      height={159}
      className={`object-contain ${className}`}
    />
  );
}

/** Exact wordmark supplied by the client: Пятый вкус · лаборатория десертов. */
export function BrandLogo({ compact = false, className = "" }: BrandLogoProps) {
  if (compact) {
    return <BrandMark className={`h-10 w-10 ${className}`} />;
  }

  return (
    <Image
      src="/brand/pyatyi-vkus-logo.jpg"
      alt="Пятый вкус — лаборатория десертов"
      width={320}
      height={297}
      priority
      className={`h-auto w-32 object-contain ${className}`}
    />
  );
}
