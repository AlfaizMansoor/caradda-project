import { Link } from "@tanstack/react-router";
import { Fuel, Gauge, Heart, MapPin, Settings2, Calendar, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "./StatusBadge";
import { VerifiedSellerBadge } from "./VerifiedSellerBadge";
import {
  categoryLabel,
  formatNumber,
  formatPrice,
  primaryImage,
  titleCase,
  type Vehicle,
} from "@/lib/vehicles";
import { cn } from "@/lib/utils";

type Props = {
  vehicle: Vehicle;
  view?: "grid" | "list" | undefined;
  saved?: boolean | undefined;
  sellerVerified?: boolean | undefined;
  onToggleSave?: ((v: Vehicle) => void) | undefined;
  onEnquire?: ((v: Vehicle) => void) | undefined;
};

export function VehicleCard({
  vehicle,
  view = "grid",
  saved,
  sellerVerified,
  onToggleSave,
  onEnquire,
}: Props) {
  const img = primaryImage(vehicle);
  const isList = view === "list";

  return (
    <article
      className={cn(
        "surface-panel hover-lift group overflow-hidden",
        isList && "sm:grid sm:grid-cols-[280px_1fr]",
      )}
    >
      <div className={cn("relative overflow-hidden bg-muted", isList ? "h-52 sm:h-full" : "h-52")}>
        {img ? (
          <img
            src={img}
            alt={`${vehicle.company} ${vehicle.model} for sale in ${vehicle.location}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold">
          {categoryLabel(vehicle.category)}
        </span>
        {onToggleSave && (
          <button
            onClick={() => onToggleSave(vehicle)}
            aria-label={saved ? "Remove from saved" : "Save vehicle"}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 transition-colors hover:bg-background"
          >
            <Heart
              className={cn("h-4 w-4", saved ? "fill-destructive text-destructive" : "text-foreground")}
            />
          </button>
        )}
      </div>

      <div className="flex flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight">
              {vehicle.company} {vehicle.model}
            </h3>
            {vehicle.variant && (
              <p className="text-sm text-muted-foreground">{vehicle.variant}</p>
            )}
          </div>
          <p className="whitespace-nowrap font-display text-lg font-bold text-gold-deep">
            {formatPrice(Number(vehicle.price))}
          </p>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> {vehicle.manufacturing_year}
          </li>
          <li className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5" /> {formatNumber(vehicle.mileage)} km
          </li>
          <li className="flex items-center gap-1.5">
            <Fuel className="h-3.5 w-3.5" /> {titleCase(vehicle.fuel_type)}
          </li>
          <li className="flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5" /> {titleCase(vehicle.transmission)}
          </li>
          <li className="col-span-2 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> {vehicle.location}
          </li>
        </ul>

        {vehicle.description && (
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{vehicle.description}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <VerificationBadge status={vehicle.verification_status} />
          {sellerVerified && <VerifiedSellerBadge />}
          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {titleCase(vehicle.ownership)} owner
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/vehicle/$id" params={{ id: vehicle.id }}>
              View Details
            </Link>
          </Button>
          {onEnquire && (
            <Button size="sm" variant="outline" onClick={() => onEnquire(vehicle)}>
              Enquire Now
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
