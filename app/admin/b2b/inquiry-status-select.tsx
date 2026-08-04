"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateB2bInquiryStatus } from "@/lib/actions/admin/b2b";

const OPTIONS = [
  { value: "new", label: "Новая" },
  { value: "contacted", label: "Связались" },
  { value: "closed", label: "Закрыта" },
];

export function InquiryStatusSelect({
  inquiryId,
  status,
}: {
  inquiryId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) =>
        startTransition(async () => {
          await updateB2bInquiryStatus(inquiryId, e.target.value);
          router.refresh();
        })
      }
      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text outline-none focus:border-accent"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
