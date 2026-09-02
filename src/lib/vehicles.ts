import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getListingSellerFn } from "@/lib/listing-seller.functions";


export type VehicleCategory = Database["public"]["Enums"]["vehicle_category"];
export type ListingStatus = Database["public"]["Enums"]["listing_status"];
export type VerificationStatus = Database["public"]["Enums"]["verification_status"];
export type EnquiryStatus = Database["public"]["Enums"]["enquiry_status"];
export type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];
export type VehicleImage = Database["public"]["Tables"]["vehicle_images"]["Row"];

export type Vehicle = VehicleRow & { vehicle_images: VehicleImage[] };

export const CATEGORIES: { value: VehicleCategory; label: string; icon: string }[] = [
  { value: "car", label: "Cars", icon: "Car" },
  { value: "bike", label: "Bikes", icon: "Bike" },
  { value: "truck", label: "Trucks", icon: "Truck" },
  { value: "tractor", label: "Tractors", icon: "Tractor" },
  { value: "bus", label: "Buses", icon: "Bus" },
  { value: "commercial", label: "Commercial Vehicles", icon: "Package" },
  { value: "other", label: "Other Vehicles", icon: "CircleDot" },
];

export const FUEL_TYPES = ["petrol", "diesel", "cng", "electric", "hybrid", "lpg"];
export const TRANSMISSIONS = ["manual", "automatic", "amt", "cvt"];
export const OWNERSHIPS = ["first", "second", "third", "fourth+"];
export const CONDITIONS = ["excellent", "good", "average", "needs work"];

export const categoryLabel = (c: VehicleCategory) =>
  CATEGORIES.find((x) => x.value === c)?.label.replace(/s$/, "") ?? c;

export const titleCase = (s: string) =>
  s.replace(/\b\w/g, (m) => m.toUpperCase()).replace(/\+/g, "+");

export function formatPrice(value: number) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${new Intl.NumberFormat("en-IN").format(Math.round(value))}`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function primaryImage(v: Vehicle): string | null {
  const imgs = [...(v.vehicle_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  return imgs[0]?.image_url ?? null;
}

export function sortedImages(v: Vehicle) {
  return [...(v.vehicle_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
}

export type VehicleFilters = {
  q?: string | undefined;
  category?: VehicleCategory | "all" | undefined;
  company?: string | undefined;
  model?: string | undefined;
  location?: string | undefined;
  vehicleNumber?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  minYear?: number | undefined;
  maxMileage?: number | undefined;
  fuel?: string[] | undefined;
  transmission?: string[] | undefined;
  ownership?: string[] | undefined;
  condition?: string[] | undefined;
  verifiedOnly?: boolean | undefined;
  sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "mileage" | undefined;
  page?: number | undefined;
  perPage?: number | undefined;
};

export async function searchVehicles(f: VehicleFilters) {
  const perPage = f.perPage ?? 9;
  const page = f.page ?? 1;

  let query = supabase
    .from("vehicles")
    .select("*, vehicle_images(*)", { count: "exact" })
    .eq("status", "active")
    .eq("verification_status", "verified");

  if (f.category && f.category !== "all") query = query.eq("category", f.category);
  if (f.company) query = query.ilike("company", `%${f.company}%`);
  if (f.model) query = query.ilike("model", `%${f.model}%`);
  if (f.location) query = query.ilike("location", `%${f.location}%`);
  if (f.vehicleNumber) query = query.ilike("vehicle_number", `%${f.vehicleNumber}%`);
  if (f.minPrice) query = query.gte("price", f.minPrice);
  if (f.maxPrice) query = query.lte("price", f.maxPrice);
  if (f.minYear) query = query.gte("manufacturing_year", f.minYear);
  if (f.maxMileage) query = query.lte("mileage", f.maxMileage);
  if (f.fuel?.length) query = query.in("fuel_type", f.fuel);
  if (f.transmission?.length) query = query.in("transmission", f.transmission);
  if (f.ownership?.length) query = query.in("ownership", f.ownership);
  if (f.condition?.length) query = query.in("condition", f.condition);
  if (f.q) {
    const term = `%${f.q}%`;
    query = query.or(
      `company.ilike.${term},model.ilike.${term},variant.ilike.${term},location.ilike.${term},description.ilike.${term}`,
    );
  }

  switch (f.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "mileage":
      query = query.order("mileage", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * perPage;
  const { data, error, count } = await query.range(from, from + perPage - 1);
  if (error) throw error;
  return { vehicles: (data ?? []) as Vehicle[], total: count ?? 0, perPage, page };
}

export async function getVehicle(id: string) {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*, vehicle_images(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Vehicle | null;
}

export async function getListingSeller(vehicleId: string) {
  return await getListingSellerFn({ data: { vehicleId } });
}

