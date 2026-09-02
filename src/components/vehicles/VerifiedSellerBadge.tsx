import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Blue tick + gold accent badge. Rendered only when the platform's seller
 * verification system marks the seller verified.
 */
export function VerifiedSellerBadge({
  className,
  label = "Verified Seller",
  size = "sm",
}: {
  className?: string;
  label?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "verified-pop inline-flex items-center gap-1.5 rounded-full border border-border-gold bg-gold-soft font-semibold text-foreground",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
        className,
      )}
      title="Seller verified by CarAdda"
    >
      <BadgeCheck
        className={cn("verified-tick text-[#1d9bf0]", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")}
        aria-hidden
      />
      <span className="text-gold-deep">{label}</span>
    </span>
  );
}
