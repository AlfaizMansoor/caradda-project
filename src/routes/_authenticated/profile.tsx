import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { BadgeCheck, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { VerifiedSellerBadge } from "@/components/vehicles/VerifiedSellerBadge";
import { titleCase } from "@/lib/vehicles";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — CarAdda" },
      {
        name: "description",
        content: "Update your CarAdda profile, contact details and view your member ID.",
      },
      { property: "og:title", content: "My Profile — CarAdda" },
      { property: "og:description", content: "Account details and verification status." },
    ],
  }),
  component: ProfilePage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid mobile number"),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(60).optional(),
  state: z.string().trim().max(60).optional(),
});

function ProfilePage() {
  const { user, profile, roles, refresh, isSeller } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        address: profile.address ?? "",
        city: profile.city ?? "",
        state: profile.state ?? "",
      });
    }
  }, [profile]);

  async function save() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        address: parsed.data.address ?? null,
        city: parsed.data.city ?? null,
        state: parsed.data.state ?? null,
      })
      .eq("id", user!.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("Profile updated");
  }

  async function becomeSeller() {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: user!.id, role: "seller" });
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("Seller access enabled");
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <SiteLayout>
      <PageHeader eyebrow="Account" title="My profile" subtitle="Keep your contact details current so buyers and sellers can reach you." />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <div className="surface-panel p-6">
            <p className="text-sm text-muted-foreground">CarAdda member ID</p>
            <p className="mt-1 font-mono text-lg font-bold text-gold-deep">
              {profile?.member_id ?? "—"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {roles.map((r) => (
                <Badge key={r} variant="secondary">
                  {titleCase(r)}
                </Badge>
              ))}
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <BadgeCheck
                  className={
                    profile?.email_verified ? "h-4 w-4 text-success" : "h-4 w-4 text-muted-foreground"
                  }
                />
                Email {profile?.email_verified ? "verified" : "not verified"}
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck
                  className={
                    profile?.phone_verified ? "h-4 w-4 text-success" : "h-4 w-4 text-muted-foreground"
                  }
                />
                Mobile {profile?.phone_verified ? "verified" : "not verified"}
              </li>
            </ul>
            {profile?.email_verified && profile?.phone_verified && (
              <VerifiedSellerBadge className="mt-4" size="md" />
            )}

            {!profile?.email_verified && (
              <Button asChild size="sm" variant="outline" className="mt-4 w-full">
                <a href="/verify-otp">Verify now</a>
              </Button>
            )}
          </div>

          {!isSeller && (
            <div className="surface-panel p-6">
              <ShieldCheck className="h-9 w-9 rounded-lg bg-gold-soft p-2 text-gold-deep" />
              <h2 className="mt-3 font-semibold">Become a seller</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Unlock the listing dashboard and start selling on CarAdda.
              </p>
              <Button className="mt-4 w-full" onClick={becomeSeller}>
                Enable seller access
              </Button>
            </div>
          )}

          <Button variant="outline" className="w-full gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>

        <div className="surface-panel grid gap-4 p-6 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="p-name">Full name</Label>
            <Input id="p-name" maxLength={100} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-email">Email</Label>
            <Input id="p-email" value={profile?.email ?? user?.email ?? ""} readOnly disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-phone">Mobile number</Label>
            <Input id="p-phone" maxLength={15} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="p-addr">Address</Label>
            <Input id="p-addr" maxLength={200} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-city">City</Label>
            <Input id="p-city" maxLength={60} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-state">State</Label>
            <Input id="p-state" maxLength={60} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={save} disabled={busy} className="gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
            </Button>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
