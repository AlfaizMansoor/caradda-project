import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationBar } from "@/components/location/LocationBar";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useVerifiedSellers } from "@/hooks/useVerifiedSellers";
import { searchVehicles, type Vehicle } from "@/lib/vehicles";

type Props = {
  title?: string;
  onEnquire?: ((v: Vehicle) => void) | undefined;
  limit?: number;
};

export function NearbyVehicles({ title = "Vehicles Near You", onEnquire, limit = 6 }: Props) {
  const { location } = useUserLocation();
  const city = location?.city ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["nearby-vehicles", city, limit],
    enabled: !!city,
    queryFn: () => searchVehicles({ location: city ?? undefined, perPage: limit, sort: "newest" }),
  });

  const vehicles = data?.vehicles ?? [];
  const verified = useVerifiedSellers(vehicles.map((v) => v.id));

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <MapPin className="h-6 w-6 text-gold-deep" /> {title}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {city
              ? `Verified listings and sellers around ${city}, prioritised for you.`
              : "Share or pick your city to see nearby listings first."}
          </p>
        </div>
        {city && (
          <Button variant="outline" asChild>
            <Link to="/buy" search={{ location: city }}>
              See all near {city}
            </Link>
          </Button>
        )}
      </div>

      <LocationBar className="mt-6" />

      {city && (
        <div className="mt-6">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : vehicles.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  sellerVerified={verified.has(v.id)}
                  onEnquire={onEnquire}
                />
              ))}
            </div>
          ) : (
            <div className="surface-panel p-8 text-center text-sm text-muted-foreground">
              No live listings in {city} yet. Browse the full marketplace or pick a nearby city.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
