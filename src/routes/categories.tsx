import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bike, Bus, Car, CircleDot, Package, Tractor, Truck } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { CATEGORIES } from "@/lib/vehicles";
import { supabase } from "@/integrations/supabase/client";

const icons = { Car, Bike, Truck, Tractor, Bus, Package, CircleDot } as const;

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Vehicle Categories — CarAdda" },
      {
        name: "description",
        content:
          "Explore cars, bikes, trucks, tractors, buses, commercial and other vehicles listed on CarAdda.",
      },
      { property: "og:title", content: "Vehicle Categories — CarAdda" },
      { property: "og:description", content: "Seven vehicle categories, all verified." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: counts } = useQuery({
    queryKey: ["category-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vehicles")
        .select("category")
        .eq("status", "active")
        .eq("verification_status", "verified");
      const map: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        map[r.category] = (map[r.category] ?? 0) + 1;
      });
      return map;
    },
  });

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Browse"
        title="Vehicle categories"
        subtitle="CarAdda is a multi-vehicle marketplace — far more than just cars."
      />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => {
          const Icon = icons[c.icon as keyof typeof icons];
          return (
            <Link
              key={c.value}
              to="/buy"
              search={{ category: c.value }}
              className="surface-panel hover-lift flex items-center gap-4 p-6"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold-deep">
                <Icon className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">{c.label}</h2>
                <p className="text-sm text-muted-foreground">
                  {counts?.[c.value] ?? 0} verified listing
                  {(counts?.[c.value] ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </SiteLayout>
  );
}
