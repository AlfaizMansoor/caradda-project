import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, List, SlidersHorizontal, Search, Loader2, CarFront } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterPanel } from "@/components/vehicles/FilterPanel";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { EnquiryModal } from "@/components/vehicles/EnquiryModal";
import { searchVehicles, type Vehicle, type VehicleFilters } from "@/lib/vehicles";
import { useAuth } from "@/hooks/useAuth";
import { useVerifiedSellers } from "@/hooks/useVerifiedSellers";
import { useUserLocation } from "@/hooks/useUserLocation";
import { LocationBar } from "@/components/location/LocationBar";
import { supabase } from "@/integrations/supabase/client";

type BuySearch = {
  category?: string | undefined;
  company?: string | undefined;
  model?: string | undefined;
  location?: string | undefined;
  vehicleNumber?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  maxMileage?: number | undefined;
  ownership?: string | undefined;
  q?: string | undefined;
};

export const Route = createFileRoute("/buy")({
  validateSearch: (search: Record<string, unknown>): BuySearch => ({
    category: typeof search['category'] === "string" ? search['category'] : undefined,
    company: typeof search['company'] === "string" ? search['company'] : undefined,
    model: typeof search['model'] === "string" ? search['model'] : undefined,
    location: typeof search['location'] === "string" ? search['location'] : undefined,
    vehicleNumber: typeof search['vehicleNumber'] === "string" ? search['vehicleNumber'] : undefined,
    minPrice: Number(search['minPrice']) || undefined,
    maxPrice: Number(search['maxPrice']) || undefined,
    maxMileage: Number(search['maxMileage']) || undefined,
    ownership: typeof search['ownership'] === "string" ? search['ownership'] : undefined,
    q: typeof search['q'] === "string" ? search['q'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Buy Vehicles — CarAdda Marketplace" },
      {
        name: "description",
        content:
          "Browse verified cars, bikes, trucks, tractors, buses and commercial vehicles. Filter by brand, price, mileage, fuel and city.",
      },
      { property: "og:title", content: "Buy Vehicles — CarAdda Marketplace" },
      {
        property: "og:description",
        content: "Powerful filters across every vehicle category on CarAdda.",
      },
    ],
  }),
  component: BuyPage,
});

function BuyPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [enquiry, setEnquiry] = useState<Vehicle | null>(null);
  const [term, setTerm] = useState(search.q ?? "");
  const { location: userLocation } = useUserLocation();
  const userCity = userLocation?.city ?? null;

  const [filters, setFilters] = useState<VehicleFilters>({
    category: (search.category as VehicleFilters["category"]) ?? "all",
    company: search.company,
    model: search.model,
    location: search.location,
    vehicleNumber: search.vehicleNumber,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    maxMileage: search.maxMileage,
    ownership: search.ownership ? [search.ownership] : undefined,
    q: search.q,
    sort: "newest",
    page: 1,
    perPage: 9,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["vehicles", filters],
    queryFn: () => searchVehicles(filters),
  });

  const { data: favorites } = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("vehicle_id");
      return (data ?? []).map((f) => f.vehicle_id);
    },
  });

  const verifiedSellers = useVerifiedSellers((data?.vehicles ?? []).map((v) => v.id));

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / (filters.perPage ?? 9))),
    [data?.total, filters.perPage],
  );

  async function toggleSave(v: Vehicle) {
    if (!user) {
      toast.error("Sign in to save vehicles");
      navigate({ to: "/auth", search: { mode: "login", redirect: "/buy" } });
      return;
    }
    if (favorites?.includes(v.id)) {
      await supabase.from("favorites").delete().eq("vehicle_id", v.id).eq("user_id", user.id);
      toast.success("Removed from saved");
    } else {
      await supabase.from("favorites").insert({ vehicle_id: v.id, user_id: user.id });
      toast.success("Saved to your wishlist");
    }
    void queryClient.invalidateQueries({ queryKey: ["favorites"] });
  }

  const clear = () =>
    setFilters({ category: "all", sort: filters.sort, page: 1, perPage: 9 });

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Marketplace"
        title="Buy a vehicle"
        subtitle="Every listing on CarAdda is reviewed and verified before it goes live."
      />

      <div className="mx-auto max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid lg:grid-cols-[300px_1fr]">
        <aside className="hidden lg:block">
          <div className="surface-panel sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto p-5">
            <h2 className="mb-5 flex items-center gap-2 font-semibold">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </h2>
            <FilterPanel filters={filters} onChange={setFilters} onClear={clear} />
          </div>
        </aside>

        <div>
          <div className="surface-panel mb-6 flex flex-wrap items-center gap-3 p-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search brand, model, city…"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && setFilters({ ...filters, q: term || undefined, page: 1 })
                }
              />
            </div>
            <Button onClick={() => setFilters({ ...filters, q: term || undefined, page: 1 })}>
              Search
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[92vw] overflow-y-auto sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-8">
                  <FilterPanel filters={filters} onChange={setFilters} onClear={clear} />
                </div>
              </SheetContent>
            </Sheet>

            <Select
              value={filters.sort ?? "newest"}
              onValueChange={(v) => setFilters({ ...filters, sort: v as VehicleFilters["sort"] })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest listings</SelectItem>
                <SelectItem value="oldest">Oldest listings</SelectItem>
                <SelectItem value="price_asc">Price: low to high</SelectItem>
                <SelectItem value="price_desc">Price: high to low</SelectItem>
                <SelectItem value="mileage">Lowest mileage</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex overflow-hidden rounded-md border border-border">
              <button
                aria-label="Grid view"
                onClick={() => setView("grid")}
                className={`grid h-9 w-9 place-items-center ${view === "grid" ? "bg-gold-soft text-gold-deep" : ""}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                aria-label="List view"
                onClick={() => setView("list")}
                className={`grid h-9 w-9 place-items-center ${view === "list" ? "bg-gold-soft text-gold-deep" : ""}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          <LocationBar className="mb-4" />
          {userCity && filters.location !== userCity && (
            <Button
              variant="outline"
              size="sm"
              className="mb-4"
              onClick={() => setFilters({ ...filters, location: userCity, page: 1 })}
            >
              Show vehicles near {userCity}
            </Button>
          )}

          <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {data ? `${data.total} vehicle${data.total === 1 ? "" : "s"} found` : "Loading…"}
          </p>


          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : data && data.vehicles.length ? (
            <div className={view === "grid" ? "grid gap-6 md:grid-cols-2" : "grid gap-6"}>
              {data.vehicles.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  view={view}
                  saved={favorites?.includes(v.id)}
                  sellerVerified={verifiedSellers.has(v.id)}
                  onToggleSave={toggleSave}
                  onEnquire={setEnquiry}
                />
              ))}
            </div>
          ) : (
            <div className="surface-panel grid place-items-center gap-3 p-14 text-center">
              <CarFront className="h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No vehicles match these filters</h3>
              <p className="text-sm text-muted-foreground">
                Try widening your price range or clearing a few filters.
              </p>
              <Button variant="outline" onClick={clear}>
                Clear filters
              </Button>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(filters.page ?? 1) <= 1}
                onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) - 1 })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {filters.page ?? 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={(filters.page ?? 1) >= totalPages}
                onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      <EnquiryModal vehicle={enquiry} open={!!enquiry} onOpenChange={(o) => !o && setEnquiry(null)} />
    </SiteLayout>
  );
}
