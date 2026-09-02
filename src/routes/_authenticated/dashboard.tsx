import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  CarFront,
  Heart,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { NearbyVehicles } from "@/components/vehicles/NearbyVehicles";
import { formatPrice } from "@/lib/vehicles";
import { VerificationBadge } from "@/components/vehicles/StatusBadge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Dashboard — CarAdda" },
      {
        name: "description",
        content:
          "Track your CarAdda listings, enquiries, saved vehicles and verification status in one place.",
      },
      { property: "og:title", content: "Your Dashboard — CarAdda" },
      { property: "og:description", content: "Buyer and seller activity at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, profile, isAdmin, isSeller } = useAuth();

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [listings, enquiriesIn, enquiriesOut, saved] = await Promise.all([
        supabase
          .from("vehicles")
          .select("id, company, model, price, verification_status, status, created_at")
          .eq("seller_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("seller_id", user!.id),
        supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("buyer_id", user!.id),
        supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
      ]);
      return {
        listings: listings.data ?? [],
        received: enquiriesIn.count ?? 0,
        sent: enquiriesOut.count ?? 0,
        saved: saved.count ?? 0,
      };
    },
  });

  const stats = [
    { icon: CarFront, label: "Your listings", value: data?.listings.length ?? 0, to: "/listings" as const },
    { icon: MessageSquare, label: "Enquiries received", value: data?.received ?? 0, to: "/enquiries" as const },
    { icon: Sparkles, label: "Enquiries sent", value: data?.sent ?? 0, to: "/enquiries" as const },
    { icon: Heart, label: "Saved vehicles", value: data?.saved ?? 0, to: "/saved" as const },
  ];

  return (
    <SiteLayout>
      <PageHeader
        eyebrow={isAdmin ? "Administrator" : isSeller ? "Seller" : "Buyer"}
        title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        subtitle={
          profile?.member_id
            ? `CarAdda member ID ${profile.member_id}`
            : "Your CarAdda activity at a glance"
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap gap-3">
          <Button asChild className="gap-2">
            <Link to="/sell">
              <Plus className="h-4 w-4" /> List a vehicle
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/buy">Browse marketplace</Link>
          </Button>
          {isAdmin && (
            <Button asChild variant="secondary" className="gap-2">
              <Link to="/admin">
                <ShieldCheck className="h-4 w-4" /> Admin panel
              </Link>
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Link key={s.label} to={s.to} className="surface-panel hover-lift p-5">
              <s.icon className="h-9 w-9 rounded-lg bg-gold-soft p-2 text-gold-deep" />
              <p className="mt-4 font-display text-3xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </Link>
          ))}
        </div>

        <div className="surface-panel mt-8 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent listings</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/listings">View all</Link>
            </Button>
          </div>
          {data?.listings.length ? (
            <ul className="mt-4 divide-y divide-border">
              {data.listings.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">
                      {l.company} {l.model}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatPrice(Number(l.price))}</p>
                  </div>
                  <VerificationBadge status={l.verification_status} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 grid place-items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
              <BadgeCheck className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                You haven&apos;t listed a vehicle yet. Listings go live after admin verification.
              </p>
              <Button asChild size="sm">
                <Link to="/sell">Create your first listing</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <NearbyVehicles
        title={isSeller ? "Marketplace activity near you" : "Vehicles Near You"}
        limit={3}
      />
    </SiteLayout>
  );
}
