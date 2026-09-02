import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HeartOff } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { EnquiryModal } from "@/components/vehicles/EnquiryModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Vehicle } from "@/lib/vehicles";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Saved Vehicles — CarAdda" },
      { name: "description", content: "Your CarAdda wishlist of shortlisted vehicles." },
      { property: "og:title", content: "Saved Vehicles — CarAdda" },
      { property: "og:description", content: "Everything you shortlisted, in one place." },
    ],
  }),
  component: Saved,
});

function Saved() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [enquiry, setEnquiry] = useState<Vehicle | null>(null);

  const { data: vehicles } = useQuery({
    queryKey: ["saved-vehicles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("vehicle:vehicles(*, vehicle_images(*))")
        .eq("user_id", user!.id);
      return (data ?? [])
        .map((r) => r.vehicle as unknown as Vehicle | null)
        .filter((v): v is Vehicle => !!v);
    },
  });

  async function unsave(v: Vehicle) {
    await supabase.from("favorites").delete().eq("vehicle_id", v.id).eq("user_id", user!.id);
    toast.success("Removed from saved");
    void queryClient.invalidateQueries({ queryKey: ["saved-vehicles"] });
  }

  return (
    <SiteLayout>
      <PageHeader eyebrow="Wishlist" title="Saved vehicles" subtitle="Shortlisted vehicles you can revisit anytime." />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {vehicles?.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} saved onToggleSave={unsave} onEnquire={setEnquiry} />
            ))}
          </div>
        ) : (
          <div className="surface-panel grid place-items-center gap-3 p-14 text-center">
            <HeartOff className="h-9 w-9 text-muted-foreground" />
            <p className="text-muted-foreground">You haven&apos;t saved any vehicles yet.</p>
            <Button asChild>
              <Link to="/buy">Browse the marketplace</Link>
            </Button>
          </div>
        )}
      </div>
      <EnquiryModal vehicle={enquiry} open={!!enquiry} onOpenChange={(o) => !o && setEnquiry(null)} />
    </SiteLayout>
  );
}
