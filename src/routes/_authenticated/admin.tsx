import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationBadge, StatusBadge } from "@/components/vehicles/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatNumber, formatPrice, primaryImage, type Vehicle } from "@/lib/vehicles";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — CarAdda" },
      {
        name: "description",
        content: "Review, verify and moderate vehicle listings submitted to CarAdda.",
      },
      { property: "og:title", content: "Admin Panel — CarAdda" },
      { property: "og:description", content: "Listing verification workflow." },
    ],
  }),
  component: AdminPanel,
});

function AdminPanel() {
  const { isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const { data: vehicles } = useQuery({
    queryKey: ["admin-vehicles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, vehicle_images(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Vehicle[];
    },
  });

  if (!loading && !isAdmin) {
    return (
      <SiteLayout>
        <div className="mx-auto grid max-w-lg place-items-center gap-4 px-4 py-24 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <h1 className="text-2xl font-bold">Administrator access only</h1>
          <p className="text-muted-foreground">
            Your account does not have the admin role for CarAdda.
          </p>
          <Button asChild>
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  async function verify(v: Vehicle) {
    const { error } = await supabase
      .from("vehicles")
      .update({ verification_status: "verified", rejection_reason: null, status: "active" })
      .eq("id", v.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listing verified and published");
    void queryClient.invalidateQueries();
  }

  async function reject(v: Vehicle) {
    const reason = (reasons[v.id] ?? "").trim();
    if (reason.length < 5) {
      toast.error("Give the seller a clear rejection reason");
      return;
    }
    const { error } = await supabase
      .from("vehicles")
      .update({ verification_status: "rejected", rejection_reason: reason })
      .eq("id", v.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listing rejected");
    void queryClient.invalidateQueries();
  }

  const pending = (vehicles ?? []).filter((v) => v.verification_status === "pending");
  const verified = (vehicles ?? []).filter((v) => v.verification_status === "verified");
  const rejected = (vehicles ?? []).filter((v) => v.verification_status === "rejected");

  const renderList = (list: Vehicle[], actions: boolean) =>
    list.length ? (
      <ul className="grid gap-4">
        {list.map((v) => {
          const img = primaryImage(v);
          return (
            <li key={v.id} className="surface-panel grid gap-4 p-4 sm:grid-cols-[150px_1fr]">
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
                </div>
                <p className="mt-1 font-display text-lg font-bold text-gold-deep">
                  {formatPrice(Number(v.price))}
                </p>
                <p className="text-sm text-muted-foreground">
                  {v.manufacturing_year} · {formatNumber(v.mileage)} km · {v.location}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  Reg {v.vehicle_number ?? "—"} · Chassis {v.chassis_number ?? "—"} · Engine{" "}
                  {v.engine_number ?? "—"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/vehicle/$id" params={{ id: v.id }}>
                      Open listing
                    </Link>
                  </Button>
                  {actions && (
                    <>
                      <Button size="sm" className="gap-1.5" onClick={() => verify(v)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                      </Button>
                      <Input
                        placeholder="Rejection reason"
                        className="h-9 w-56"
                        value={reasons[v.id] ?? ""}
                        onChange={(e) => setReasons({ ...reasons, [v.id]: e.target.value })}
                      />
                      <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => reject(v)}>
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    ) : (
      <p className="surface-panel p-10 text-center text-muted-foreground">Nothing here yet.</p>
    );

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Administration"
        title="Listing verification"
        subtitle="Approve genuine listings and reject the ones with document mismatches."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="verified">Verified ({verified.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-6">
            {renderList(pending, true)}
          </TabsContent>
          <TabsContent value="verified" className="mt-6">
            {renderList(verified, false)}
          </TabsContent>
          <TabsContent value="rejected" className="mt-6">
            {renderList(rejected, true)}
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}
