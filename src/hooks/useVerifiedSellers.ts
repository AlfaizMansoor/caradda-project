import { useQuery } from "@tanstack/react-query";
import { getVerifiedSellerVehicleIdsFn } from "@/lib/seller-verification.functions";

/** Set of vehicle ids whose seller is platform-verified. */
export function useVerifiedSellers(vehicleIds: string[]) {
  const ids = [...vehicleIds].sort();
  const { data } = useQuery({
    queryKey: ["verified-sellers", ids],
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: () => getVerifiedSellerVehicleIdsFn({ data: { vehicleIds: ids } }),
  });
  return new Set(data ?? []);
}
