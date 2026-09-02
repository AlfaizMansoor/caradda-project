import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES,
  CONDITIONS,
  FUEL_TYPES,
  OWNERSHIPS,
  TRANSMISSIONS,
  titleCase,
  type VehicleFilters,
} from "@/lib/vehicles";

type Props = {
  filters: VehicleFilters;
  onChange: (f: VehicleFilters) => void;
  onClear: () => void;
};

function toggle(list: string[] | undefined, value: string) {
  const set = new Set(list ?? []);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return set.size ? Array.from(set) : undefined;
}

export function FilterPanel({ filters, onChange, onClear }: Props) {
  const set = (patch: Partial<VehicleFilters>) => onChange({ ...filters, ...patch, page: 1 });

  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <Label>Vehicle category</Label>
        <Select
          value={filters.category ?? "all"}
          onValueChange={(v) => set({ category: v as VehicleFilters["category"] })}
        >
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="f-company">Brand / company</Label>
          <Input
            id="f-company"
            value={filters.company ?? ""}
            placeholder="e.g. Tata"
            onChange={(e) => set({ company: e.target.value || undefined })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="f-model">Model</Label>
          <Input
            id="f-model"
            value={filters.model ?? ""}
            placeholder="e.g. Nexon"
            onChange={(e) => set({ model: e.target.value || undefined })}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="f-min">Min price (₹)</Label>
          <Input
            id="f-min"
            type="number"
            min={0}
            value={filters.minPrice ?? ""}
            onChange={(e) => set({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="f-max">Max price (₹)</Label>
          <Input
            id="f-max"
            type="number"
            min={0}
            value={filters.maxPrice ?? ""}
            onChange={(e) => set({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="f-year">Min manufacturing year</Label>
          <Input
            id="f-year"
            type="number"
            value={filters.minYear ?? ""}
            onChange={(e) => set({ minYear: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="f-mileage">Max mileage (km)</Label>
          <Input
            id="f-mileage"
            type="number"
            value={filters.maxMileage ?? ""}
            onChange={(e) =>
              set({ maxMileage: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="f-loc">Location</Label>
          <Input
            id="f-loc"
            value={filters.location ?? ""}
            placeholder="City or state"
            onChange={(e) => set({ location: e.target.value || undefined })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="f-reg">Vehicle number</Label>
          <Input
            id="f-reg"
            value={filters.vehicleNumber ?? ""}
            placeholder="e.g. MH12"
            onChange={(e) => set({ vehicleNumber: e.target.value || undefined })}
          />
        </div>
      </div>

      {(
        [
          ["Fuel type", FUEL_TYPES, "fuel"],
          ["Transmission", TRANSMISSIONS, "transmission"],
          ["Ownership", OWNERSHIPS, "ownership"],
          ["Condition", CONDITIONS, "condition"],
        ] as const
      ).map(([label, options, key]) => (
        <div key={key} className="space-y-2">
          <Label>{label}</Label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {options.map((o) => (
              <label key={o} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={(filters[key] ?? []).includes(o)}
                  onCheckedChange={() => set({ [key]: toggle(filters[key], o) } as VehicleFilters)}
                />
                {titleCase(o)}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onClear}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
