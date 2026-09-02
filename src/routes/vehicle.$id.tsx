import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  Download,
  Fuel,
  Gauge,
  Heart,
  MapPin,
  Phone,
  Settings2,
  Share2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VerificationBadge } from "@/components/vehicles/StatusBadge";
import { VerifiedSellerBadge } from "@/components/vehicles/VerifiedSellerBadge";
import { EnquiryModal } from "@/components/vehicles/EnquiryModal";
import {
  categoryLabel,
  formatNumber,
  formatPrice,
  getListingSeller,
  getVehicle,
  sortedImages,
  titleCase,
} from "@/lib/vehicles";
import { generateVehiclePdf } from "@/lib/vehicle-pdf";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vehicle/$id")({
  head: () => ({
    meta: [
      { title: "Vehicle Details — CarAdda" },
      {
        name: "description",
        content:
          "Full specifications, photo gallery and seller verification for this CarAdda listing.",
      },
      { property: "og:title", content: "Vehicle Details — CarAdda" },
      { property: "og:description", content: "View photos, specs and enquire in one click." },
    ],
  }),
  component: VehicleDetails,
});

function VehicleDetails() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [active, setActive] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicle(id),
  });
  const { data: seller } = useQuery({
    queryKey: ["vehicle-seller", id],
    queryFn: () => getListingSeller(id),
  });
  const { data: favorites } = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("vehicle_id");
      return (data ?? []).map((f) => f.vehicle_id);
    },
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Skeleton className="h-[420px] w-full rounded-xl" />
        </div>
      </SiteLayout>
    );
  }

  if (!vehicle) {
    return (
      <SiteLayout>
        <div className="mx-auto grid max-w-lg place-items-center gap-4 px-4 py-24 text-center">
          <h1 className="text-2xl font-bold">Listing unavailable</h1>
          <p className="text-muted-foreground">
            This vehicle may have been sold, removed or is awaiting verification.
          </p>
          <Button asChild>
            <Link to="/buy">Browse other vehicles</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const images = sortedImages(vehicle);
  const isSaved = favorites?.includes(vehicle.id);

  async function toggleSave() {
    if (!vehicle) return;
    if (!user) {
      toast.error("Sign in to save this vehicle");
      navigate({ to: "/auth", search: { mode: "login", redirect: `/vehicle/${vehicle.id}` } });
      return;
    }
    if (isSaved) {
      await supabase.from("favorites").delete().eq("vehicle_id", vehicle.id).eq("user_id", user.id);
      toast.success("Removed from saved vehicles");
    } else {
      await supabase.from("favorites").insert({ vehicle_id: vehicle.id, user_id: user.id });
      toast.success("Saved to your wishlist");
    }
    void queryClient.invalidateQueries({ queryKey: ["favorites"] });
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${vehicle!.company} ${vehicle!.model}`, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Listing link copied");
  }

  const specs: [string, string][] = [
    ["Category", categoryLabel(vehicle.category)],
    ["Company", vehicle.company],
    ["Model", vehicle.model],
    ["Variant", vehicle.variant || "—"],
    ["Manufacturing year", String(vehicle.manufacturing_year)],
    ["Registration year", vehicle.registration_year ? String(vehicle.registration_year) : "—"],
    ["Mileage", `${formatNumber(vehicle.mileage)} km`],
    ["Fuel type", titleCase(vehicle.fuel_type)],
    ["Transmission", titleCase(vehicle.transmission)],
    ["Ownership", `${titleCase(vehicle.ownership)} owner`],
    ["Condition", titleCase(vehicle.condition)],
    ["Location", vehicle.location],
    ["Registration number", vehicle.vehicle_number ? maskTail(vehicle.vehicle_number) : "Shared on enquiry"],
    ["Chassis number", vehicle.chassis_number ? maskTail(vehicle.chassis_number) : "Shared on enquiry"],
  ];

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="mb-5 text-sm text-muted-foreground">
          <Link to="/buy" className="hover:text-gold-deep">
            Buy vehicles
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">
            {vehicle.company} {vehicle.model}
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="overflow-hidden rounded-2xl border border-border bg-muted">
              {images[active] ? (
                <img
                  src={images[active]!.image_url}
                  alt={`${vehicle.company} ${vehicle.model} photo ${active + 1}`}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="grid aspect-[4/3] place-items-center text-muted-foreground">
                  No photos provided
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8">
                {images.map((im, i) => (
                  <button
                    key={im.id}
                    onClick={() => setActive(i)}
                    className={cn(
                      "overflow-hidden rounded-lg border-2",
                      i === active ? "border-gold" : "border-transparent",
                    )}
                  >
                    <img src={im.image_url} alt="" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="surface-panel mt-8 p-6">
              <h2 className="text-lg font-semibold">Specifications</h2>
              <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {specs.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-border pb-2">
                    <dt className="text-sm text-muted-foreground">{k}</dt>
                    <dd className="text-sm font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {vehicle.description && (
              <div className="surface-panel mt-6 p-6">
                <h2 className="text-lg font-semibold">Description</h2>
                <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                  {vehicle.description}
                </p>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="surface-panel sticky top-24 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold leading-tight">
                    {vehicle.company} {vehicle.model}
                  </h1>
                  {vehicle.variant && (
                    <p className="text-sm text-muted-foreground">{vehicle.variant}</p>
                  )}
                </div>
                <VerificationBadge status={vehicle.verification_status} />
              </div>

              <p className="mt-4 font-display text-3xl font-bold text-gold-deep">
                {formatPrice(Number(vehicle.price))}
              </p>

              <ul className="mt-5 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {vehicle.manufacturing_year}
                </li>
                <li className="flex items-center gap-1.5">
                  <Gauge className="h-4 w-4" /> {formatNumber(vehicle.mileage)} km
                </li>
                <li className="flex items-center gap-1.5">
                  <Fuel className="h-4 w-4" /> {titleCase(vehicle.fuel_type)}
                </li>
                <li className="flex items-center gap-1.5">
                  <Settings2 className="h-4 w-4" /> {titleCase(vehicle.transmission)}
                </li>
                <li className="col-span-2 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {vehicle.location}
                </li>
              </ul>

              <div className="mt-6 grid gap-2">
                <Button size="lg" onClick={() => setEnquiryOpen(true)}>
                  Enquire Now
                </Button>
                <Button variant="outline" onClick={() => setEnquiryOpen(true)} className="gap-2">
                  <Phone className="h-4 w-4" /> Contact Seller
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={toggleSave} className="gap-2">
                    <Heart className={cn("h-4 w-4", isSaved && "fill-destructive text-destructive")} />
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                  <Button variant="outline" onClick={share} className="gap-2">
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={() => generateVehiclePdf(vehicle)}
                >
                  <Download className="h-4 w-4" /> Download Vehicle Details (PDF)
                </Button>
              </div>
            </div>

            <div className="surface-panel p-6">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <UserRound className="h-4 w-4" /> Seller information
              </h2>
              <p className="mt-3 text-sm font-semibold">{seller?.display_name ?? "CarAdda Seller"}</p>
              {seller?.verified && <VerifiedSellerBadge className="mt-2" />}
              <p className="text-sm text-muted-foreground">
                {[seller?.city, seller?.state].filter(Boolean).join(", ") || vehicle.location}
              </p>
              {seller?.member_id && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">{seller.member_id}</p>
              )}
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-gold-soft p-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                Seller identity documents and address proof are stored privately and are never shown
                to buyers or included in the downloadable PDF.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <EnquiryModal vehicle={vehicle} open={enquiryOpen} onOpenChange={setEnquiryOpen} />
    </SiteLayout>
  );
}

function maskTail(value: string) {
  const visible = value.slice(0, Math.max(2, value.length - 4));
  return `${visible}${"•".repeat(Math.min(4, value.length))}`;
}
