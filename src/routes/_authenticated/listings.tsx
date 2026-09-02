import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Eye, Plus, Trash2 } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { VerificationBadge, StatusBadge } from "@/components/vehicles/StatusBadge";
import { VerifiedSellerBadge } from "@/components/vehicles/VerifiedSellerBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatNumber, formatPrice, primaryImage, type Vehicle } from "@/lib/vehicles";
import { generateVehiclePdf } from "@/lib/vehicle-pdf";

export const Route = createFileRoute("/_authenticated/listings")({
  head: () => ({
    meta: [
      { title: "My Listings — CarAdda" },
      {
        name: "description",
        content: "Manage your CarAdda vehicle listings, verification status and availability.",
      },
      { property: "og:title", content: "My Listings — CarAdda" },
      { property: "og:description", content: "Seller listing management." },
    ],
  }),
  component: MyListings,
});

function MyListings() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const sellerVerified = !!profile?.email_verified && !!profile?.phone_verified;

  const { data: listings } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, vehicle_images(*)")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Vehicle[];
    },
  });

  async function markSold(v: Vehicle) {
    await supabase.from("vehicles").update({ status: "sold" }).eq("id", v.id);
    toast.success("Marked as sold");
    void queryClient.invalidateQueries({ queryKey: ["my-listings"] });
  }

  async function remove(v: Vehicle) {
    await supabase.from("vehicles").delete().eq("id", v.id);
    toast.success("Listing deleted");
    void queryClient.invalidateQueries({ queryKey: ["my-listings"] });
  }

  return (
    <SiteLayout>
      <PageHeader eyebrow="Seller" title="My listings" subtitle="Track verification and manage availability." />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex justify-end">
          <Button asChild className="gap-2">
            <Link to="/sell">
              <Plus className="h-4 w-4" /> New listing
            </Link>
          </Button>
        </div>

        {listings?.length ? (
          <ul className="grid gap-4">
            {listings.map((v) => {
              const img = primaryImage(v);
              return (
                <li key={v.id} className="surface-panel grid gap-4 p-4 sm:grid-cols-[160px_1fr_auto]">
                  <div className="h-28 overflow-hidden rounded-lg bg-muted">
                    {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">
                        {v.company} {v.model}
                      </h2>
                      <VerificationBadge status={v.verification_status} />
                      <StatusBadge status={v.status} />
                      {sellerVerified && <VerifiedSellerBadge />}
                    </div>
                    <p className="mt-1 font-display text-lg font-bold text-gold-deep">
                      {formatPrice(Number(v.price))}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {v.manufacturing_year} · {formatNumber(v.mileage)} km · {v.location}
                    </p>
                    {v.verification_status === "rejected" && v.rejection_reason && (
                      <p className="mt-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                        Rejected: {v.rejection_reason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-row gap-2 sm:flex-col">
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <Link to="/vehicle/$id" params={{ id: v.id }}>
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => generateVehiclePdf(v)}>
                      <Download className="h-3.5 w-3.5" /> PDF
                    </Button>
                    {v.status !== "sold" && (
                      <Button size="sm" variant="secondary" onClick={() => markSold(v)}>
                        Mark sold
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="gap-1.5 text-destructive" onClick={() => remove(v)}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="surface-panel grid place-items-center gap-3 p-14 text-center">
            <p className="text-muted-foreground">No listings yet.</p>
            <Button asChild>
              <Link to="/sell">List your first vehicle</Link>
            </Button>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
