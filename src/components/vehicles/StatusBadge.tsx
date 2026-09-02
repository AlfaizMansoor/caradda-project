import { BadgeCheck, Clock, XCircle, CircleSlash, Tag, FileEdit } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListingStatus, VerificationStatus } from "@/lib/vehicles";

const base =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border";

export function VerificationBadge({
  status,
  className,
}: {
  status: VerificationStatus;
  className?: string;
}) {
  const map = {
    verified: {
      icon: BadgeCheck,
      label: "Verified",
      cls: "border-success/30 bg-success/10 text-success",
    },
    pending: {
      icon: Clock,
      label: "Pending verification",
      cls: "border-warning/40 bg-warning/10 text-warning-foreground",
    },
    rejected: {
      icon: XCircle,
      label: "Rejected",
      cls: "border-destructive/30 bg-destructive/10 text-destructive",
    },
  } as const;
  const { icon: Icon, label, cls } = map[status];
  return (
    <span className={cn(base, cls, className)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: ListingStatus; className?: string }) {
  const map = {
    draft: { icon: FileEdit, label: "Draft", cls: "border-border bg-muted text-muted-foreground" },
    active: { icon: Tag, label: "Active", cls: "border-border-gold bg-gold-soft text-gold-deep" },
    sold: { icon: BadgeCheck, label: "Sold", cls: "border-success/30 bg-success/10 text-success" },
    inactive: {
      icon: CircleSlash,
      label: "Inactive",
      cls: "border-border bg-muted text-muted-foreground",
    },
    suspended: {
      icon: XCircle,
      label: "Suspended",
      cls: "border-destructive/30 bg-destructive/10 text-destructive",
    },
  } as const;
  const { icon: Icon, label, cls } = map[status];
  return (
    <span className={cn(base, cls, className)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
