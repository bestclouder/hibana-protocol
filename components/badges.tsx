import { statusClasses } from "@/lib/format";
import { STATUS_LABELS, type TicketStatus } from "@/lib/types";

export function TicketTag({ number, className = "" }: { number: string; className?: string }) {
  return (
    <span className={`tag-chip bg-dusk-wash text-dusk-deep border border-dusk/25 ${className}`}>
      {number}
    </span>
  );
}

export function ClusterTag({ number, className = "" }: { number: string; className?: string }) {
  return (
    <span className={`tag-chip bg-gold-wash text-gold border border-gold/30 ${className}`}>
      {number}
    </span>
  );
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClasses(status)}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function SparkMark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`text-ember ${className}`}>
      ✦
    </span>
  );
}
