import { createServerFn } from "@tanstack/react-start";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns the subset of vehicle ids (live listings only) whose seller is
 * verified by the platform (email + phone verified). Sellers cannot set this
 * themselves — it is derived from the existing verification flags.
 */
export const getVerifiedSellerVehicleIdsFn = createServerFn({ method: "POST" })
  .inputValidator((data: { vehicleIds: string[] }) => {
    const ids = (data?.vehicleIds ?? []).filter((id) => UUID.test(id)).slice(0, 60);
    return { vehicleIds: ids };
  })
  .handler(async ({ data }): Promise<string[]> => {
    if (!data.vehicleIds.length) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: vehicles, error } = await supabaseAdmin
      .from("vehicles")
      .select("id, seller_id")
      .in("id", data.vehicleIds)
      .eq("status", "active")
      .eq("verification_status", "verified");
    if (error) return [];

    const sellerIds = [...new Set((vehicles ?? []).map((v) => v.seller_id).filter(Boolean))] as string[];
    if (!sellerIds.length) return [];

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email_verified, phone_verified")
      .in("id", sellerIds);

    const verified = new Set(
      (profiles ?? []).filter((p) => p.email_verified && p.phone_verified).map((p) => p.id),
    );

    return (vehicles ?? [])
      .filter((v) => v.seller_id && verified.has(v.seller_id))
      .map((v) => v.id);
  });
