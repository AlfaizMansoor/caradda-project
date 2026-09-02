import { createServerFn } from "@tanstack/react-start";

export type ListingSeller = {
  display_name: string;
  city: string | null;
  state: string | null;
  member_id: string | null;
  verified: boolean;
};

/**
 * Public, read-only seller summary for a LIVE listing (active + verified).
 * Only non-sensitive fields are returned; no email/phone/address.
 */
export const getListingSellerFn = createServerFn({ method: "GET" })
  .inputValidator((data: { vehicleId: string }) => {
    const id = String(data?.vehicleId ?? "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new Error("Invalid vehicle id");
    }
    return { vehicleId: id };
  })
  .handler(async ({ data }): Promise<ListingSeller | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: vehicle, error: vErr } = await supabaseAdmin
      .from("vehicles")
      .select("seller_id, status, verification_status")
      .eq("id", data.vehicleId)
      .eq("status", "active")
      .eq("verification_status", "verified")
      .maybeSingle();
    if (vErr) throw new Error("Unable to load listing");
    if (!vehicle) return null;

    if (!vehicle.seller_id) {
      return { display_name: "CarAdda Seller", city: null, state: null, member_id: null, verified: false };
    }

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("full_name, city, state, member_id, email_verified, phone_verified")
      .eq("id", vehicle.seller_id)
      .maybeSingle();
    if (pErr) throw new Error("Unable to load listing");

    return {
      display_name: profile?.full_name?.trim() || "CarAdda Seller",
      city: profile?.city ?? null,
      state: profile?.state ?? null,
      member_id: profile?.member_id ?? null,
      verified: Boolean(profile?.email_verified && profile?.phone_verified),
    };
  });
