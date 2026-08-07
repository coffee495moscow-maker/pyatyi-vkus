import { getAllB2bInquiries } from "@/lib/queries/admin";
import { InquiryStatusSelect } from "./inquiry-status-select";

export default async function AdminB2bPage() {
  const inquiries = await getAllB2bInquiries();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl">B2B-заявки</h1>
      <div className="flex flex-col gap-3">
        {inquiries.map((inquiry) => (
          <div key={inquiry.id} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{inquiry.company_name}</p>
                <p className="text-sm text-text-muted">{inquiry.contact_name}</p>
              </div>
              <InquiryStatusSelect inquiryId={inquiry.id} status={inquiry.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-text-muted">
              <a href={`tel:${inquiry.phone}`} className="hover:text-accent">
                {inquiry.phone}
              </a>
              {inquiry.email && (
                <a href={`mailto:${inquiry.email}`} className="hover:text-accent">
                  {inquiry.email}
                </a>
              )}
            </div>
            {inquiry.message && (
              <p className="mt-2 text-sm text-text">{inquiry.message}</p>
            )}
            <p className="mt-2 text-xs text-text-muted">
              {new Date(inquiry.created_at).toLocaleString("ru-RU")}
            </p>
          </div>
        ))}
        {inquiries.length === 0 && (
          <p className="text-sm text-text-muted">Пока нет заявок.</p>
        )}
      </div>
    </div>
  );
}
