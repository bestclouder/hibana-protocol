import type { TicketStatus } from "@/lib/types";

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Tailwind classes for a ticket status badge. */
export function statusClasses(status: TicketStatus): string {
  switch (status) {
    case "open":
      return "bg-dusk-wash text-dusk border-dusk/25";
    case "acknowledged":
      return "bg-gold-wash text-gold border-gold/30";
    case "linked_to_cluster":
      return "bg-dusk-wash text-dusk border-dusk/40";
    case "solution_posted":
      return "bg-ember-wash text-ember-deep border-ember/30";
    case "resolved":
      return "bg-moss-wash text-moss border-moss/30";
    case "still_stuck":
      return "bg-red-50 text-red-700 border-red-200";
    case "closed":
      return "bg-sand text-stone border-stone/20";
  }
}
