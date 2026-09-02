import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ShieldCheck,
  FileDown,
  Users,
  ArrowRight,
  Car,
  Bike,
  Truck,
  Tractor,
  Bus,
  Package,
  CircleDot,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { NearbyVehicles } from "@/components/vehicles/NearbyVehicles";
import { EnquiryModal } from "@/components/vehicles/EnquiryModal";
import { useVerifiedSellers } from "@/hooks/useVerifiedSellers";
import { CATEGORIES, OWNERSHIPS, searchVehicles, titleCase, type Vehicle } from "@/lib/vehicles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CarAdda — Find Your Next Vehicle" },
      {
        name: "description",
        content:
          "Buy and sell cars, bikes, trucks, tractors, buses and commercial vehicles with confidence on CarAdda.",
      },
      { property: "og:title", content: "CarAdda — Find Your Next Vehicle" },
      {
        property: "og:description",
        content: "India's verified multi-vehicle marketplace. Browse, enquire and download details.",
      },
    ],
  }),
  component: Home,
});

const icons = { Car, Bike, Truck, Tractor, Bus, Package, CircleDot } as const;

function Home() {
  const navigate = useNavigate();
  const [enquiry, setEnquiry] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({
    category: "all",
    company: "",
    model: "",
    minPrice: "",
    maxPrice: "",
    location: "",
    vehicleNumber: "",
    maxMileage: "",
    ownership: "any",
  });

  const { data } = useQuery({
    queryKey: ["featured-vehicles"],
    queryFn: () => searchVehicles({ perPage: 6, sort: "newest" }),
  });

  const featuredVerified = useVerifiedSellers((data?.vehicles ?? []).map((v) => v.id));

  function runSearch() {
    navigate({
      to: "/buy",
      search: {
        category: form.category,
        company: form.company || undefined,
        model: form.model || undefined,
        location: form.location || undefined,
        vehicleNumber: form.vehicleNumber || undefined,
        minPrice: form.minPrice ? Number(form.minPrice) : undefined,
        maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
        maxMileage: form.maxMileage ? Number(form.maxMileage) : undefined,
        ownership: form.ownership !== "any" ? form.ownership : undefined,
      },
    });
  }

  return (
    <SiteLayout>
      <section className="relative overflow-hidden border-b border-border soft-hero">
        <div className="absolute inset-x-0 top-0 h-px gold-rule" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border-gold bg-gold-soft px-3 py-1 text-xs font-semibold text-gold-deep">
              <ShieldCheck className="h-3.5 w-3.5" /> Every listing admin-verified
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] md:text-6xl">
              Find Your Next Vehicle with <span className="gold-text">CarAdda</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Buy and sell cars, bikes, trucks, tractors, buses and commercial vehicles with
              confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/buy">
                  Browse Vehicles <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/sell">Sell Your Vehicle</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
              {[
                ["7", "Vehicle categories"],
                ["100%", "Verified listings"],
                ["PDF", "Instant detail sheets"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-display text-2xl font-bold text-gold-deep">{v}</dt>
                  <dd className="text-xs text-muted-foreground">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80"
              alt="Premium car listed for sale on CarAdda"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-[var(--shadow-card-hover)]"
            />
            <div className="surface-panel absolute -bottom-6 left-4 hidden gap-3 p-4 sm:flex">
              <FileDown className="h-9 w-9 rounded-lg bg-gold-soft p-2 text-gold-deep" />
              <div>
                <p className="text-sm font-semibold">Download vehicle PDF</p>
                <p className="text-xs text-muted-foreground">Auto-generated on every enquiry</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold md:text-3xl">Search Vehicles</h2>
        <p className="mt-2 text-muted-foreground">
          Filter across every category, brand, budget and city.
        </p>

        <div className="surface-panel mt-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-2">
            <Label>Vehicle category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(
            [
              ["Company / brand", "company", "e.g. Hyundai"],
              ["Model", "model", "e.g. Creta"],
              ["Location", "location", "City or state"],
              ["Minimum price (₹)", "minPrice", "200000"],
              ["Maximum price (₹)", "maxPrice", "2000000"],
              ["Vehicle number", "vehicleNumber", "MH12 AB 1234"],
              ["Max mileage (km)", "maxMileage", "60000"],
            ] as const
          ).map(([label, key, ph]) => (
            <div className="grid gap-2" key={key}>
              <Label htmlFor={`h-${key}`}>{label}</Label>
              <Input
                id={`h-${key}`}
                placeholder={ph}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="grid gap-2">
            <Label>Ownership</Label>
            <Select
              value={form.ownership}
              onValueChange={(v) => setForm({ ...form, ownership: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any owner</SelectItem>
                {OWNERSHIPS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {titleCase(o)} owner
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end lg:col-span-4">
            <Button className="w-full gap-2 sm:w-auto" size="lg" onClick={runSearch}>
              <Search className="h-4 w-4" /> Search Vehicles
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-surface py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold md:text-3xl">Popular categories</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
            {CATEGORIES.map((c) => {
              const Icon = icons[c.icon as keyof typeof icons];
              return (
                <Link
                  key={c.value}
                  to="/buy"
                  search={{ category: c.value }}
                  className="surface-panel hover-lift flex flex-col items-center gap-3 p-5 text-center"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold-soft text-gold-deep">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-semibold">{c.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Nearby */}
      <NearbyVehicles onEnquire={setEnquiry} />

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Freshly listed</h2>
            <p className="mt-2 text-muted-foreground">Verified vehicles added recently.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/buy">View all</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(data?.vehicles ?? []).map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              sellerVerified={featuredVerified.has(v.id)}
              onEnquire={setEnquiry}
            />
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="bg-surface py-14">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-3">
          {[
            [ShieldCheck, "Verified before live", "Admins review every listing and seller before it appears publicly."],
            [FileDown, "PDF detail sheets", "Each enquiry generates a branded PDF with photos and specs — never private documents."],
            [Users, "Unique member IDs", "Every buyer and seller gets a CarAdda ID with email and phone verification status."],
          ].map(([Icon, title, body]) => {
            const I = Icon as typeof ShieldCheck;
            return (
              <div key={title as string} className="surface-panel p-6">
                <I className="h-10 w-10 rounded-xl bg-gold-soft p-2.5 text-gold-deep" />
                <h3 className="mt-4 text-lg font-semibold">{title as string}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <EnquiryModal
        vehicle={enquiry}
        open={!!enquiry}
        onOpenChange={(o) => !o && setEnquiry(null)}
      />
    </SiteLayout>
  );
}
