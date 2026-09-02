import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  CATEGORIES,
  CONDITIONS,
  FUEL_TYPES,
  OWNERSHIPS,
  TRANSMISSIONS,
  titleCase,
  type VehicleCategory,
} from "@/lib/vehicles";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sell")({
  head: () => ({
    meta: [
      { title: "Sell Your Vehicle — CarAdda" },
      {
        name: "description",
        content:
          "List your car, bike, truck, tractor or commercial vehicle on CarAdda in five guided steps with admin verification.",
      },
      { property: "og:title", content: "Sell Your Vehicle — CarAdda" },
      { property: "og:description", content: "Guided listing form with document verification." },
    ],
  }),
  component: SellPage,
});

const STEPS = ["Vehicle type", "Details", "Pricing & location", "Photos", "Documents"] as const;
const YEAR = new Date().getFullYear();

const detailsSchema = z.object({
  company: z.string().trim().min(2, "Enter the brand/company").max(60),
  model: z.string().trim().min(1, "Enter the model").max(60),
  variant: z.string().trim().max(60).optional(),
  manufacturing_year: z
    .number()
    .int()
    .min(1950, "Year looks too old")
    .max(YEAR, "Year cannot be in the future"),
  registration_year: z.number().int().min(1950).max(YEAR).optional(),
  mileage: z.number().int().min(0, "Mileage cannot be negative").max(2000000),
  vehicle_number: z.string().trim().max(20).optional(),
  chassis_number: z.string().trim().max(30).optional(),
  engine_number: z.string().trim().max(30).optional(),
});

type Draft = {
  category: VehicleCategory;
  company: string;
  model: string;
  variant: string;
  manufacturing_year: string;
  registration_year: string;
  mileage: string;
  fuel_type: string;
  transmission: string;
  ownership: string;
  condition: string;
  vehicle_number: string;
  chassis_number: string;
  engine_number: string;
  price: string;
  location: string;
  description: string;
};

function SellPage() {
  const { user, isSeller, refresh } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [docs, setDocs] = useState<File[]>([]);
  const [draft, setDraft] = useState<Draft>({
    category: "car",
    company: "",
    model: "",
    variant: "",
    manufacturing_year: "",
    registration_year: "",
    mileage: "",
    fuel_type: "petrol",
    transmission: "manual",
    ownership: "first",
    condition: "good",
    vehicle_number: "",
    chassis_number: "",
    engine_number: "",
    price: "",
    location: "",
    description: "",
  });

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  function validateStep(): boolean {
    if (step === 1) {
      const parsed = detailsSchema.safeParse({
        company: draft.company,
        model: draft.model,
        variant: draft.variant || undefined,
        manufacturing_year: Number(draft.manufacturing_year),
        registration_year: draft.registration_year ? Number(draft.registration_year) : undefined,
        mileage: Number(draft.mileage || 0),
        vehicle_number: draft.vehicle_number || undefined,
        chassis_number: draft.chassis_number || undefined,
        engine_number: draft.engine_number || undefined,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]!.message);
        return false;
      }
    }
    if (step === 2) {
      const price = Number(draft.price);
      if (!price || price <= 0) {
        toast.error("Enter a valid asking price");
        return false;
      }
      if (draft.location.trim().length < 2) {
        toast.error("Enter the vehicle location");
        return false;
      }
    }
    if (step === 3 && images.length === 0) {
      toast.error("Add at least one photo of the vehicle");
      return false;
    }
    return true;
  }

  function next() {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function addImages(files: FileList | null) {
    if (!files) return;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const oversized = picked.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      toast.error("Each photo must be under 5 MB");
      return;
    }
    setImages((prev) => [...prev, ...picked].slice(0, 10));
  }

  async function submit() {
    if (!user) return;
    if (!validateStep()) return;
    setBusy(true);
    try {
      if (!isSeller) {
        await supabase.from("user_roles").insert({ user_id: user.id, role: "seller" });
        await refresh();
      }

      const { data: vehicle, error } = await supabase
        .from("vehicles")
        .insert({
          seller_id: user.id,
          category: draft.category,
          company: draft.company.trim(),
          model: draft.model.trim(),
          variant: draft.variant.trim() || null,
          manufacturing_year: Number(draft.manufacturing_year),
          registration_year: draft.registration_year ? Number(draft.registration_year) : null,
          mileage: Number(draft.mileage || 0),
          fuel_type: draft.fuel_type,
          transmission: draft.transmission,
          ownership: draft.ownership,
          condition: draft.condition,
          vehicle_number: draft.vehicle_number.trim() || null,
          chassis_number: draft.chassis_number.trim() || null,
          engine_number: draft.engine_number.trim() || null,
          price: Number(draft.price),
          location: draft.location.trim(),
          description: draft.description.trim() || null,
          status: "active",
          verification_status: "pending",
        })
        .select("id")
        .single();
      if (error) throw error;

      for (let i = 0; i < images.length; i++) {
        const file = images[i]!;
        const path = `${user.id}/${vehicle.id}/${Date.now()}-${i}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("vehicle-images").upload(path, file);
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage
          .from("vehicle-images")
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
        if (!signed?.signedUrl) continue;
        await supabase.from("vehicle_images").insert({
          vehicle_id: vehicle.id,
          image_url: signed.signedUrl,
          is_primary: i === 0,
          sort_order: i,
        });
      }

      for (const doc of docs) {
        const path = `${user.id}/${vehicle.id}/${Date.now()}-${doc.name.replace(/[^\w.-]/g, "_")}`;
        const { error: dErr } = await supabase.storage.from("seller-documents").upload(path, doc);
        if (dErr) throw dErr;
        await supabase.from("documents").insert({
          user_id: user.id,
          vehicle_id: vehicle.id,
          document_type: "ownership_proof",
          secure_file_path: path,
        });
      }

      void queryClient.invalidateQueries();
      toast.success("Listing submitted — our team will verify it shortly");
      navigate({ to: "/listings" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit your listing");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Sell"
        title="List your vehicle"
        subtitle="Five quick steps. Our admins verify every listing before it goes live."
      />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <ol className="mb-8 flex flex-wrap gap-2">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                i === step
                  ? "border-border-gold bg-gold-soft text-gold-deep"
                  : i < step
                    ? "border-border bg-surface text-muted-foreground"
                    : "border-border text-muted-foreground",
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
              {label}
            </li>
          ))}
        </ol>

        <div className="surface-panel p-6 sm:p-8">
          {step === 0 && (
            <div>
              <h2 className="text-lg font-semibold">What are you selling?</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => set("category", c.value)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition",
                      draft.category === c.value
                        ? "border-gold bg-gold-soft"
                        : "border-border hover:border-border-gold",
                    )}
                  >
                    <p className="font-semibold">{c.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company / brand" value={draft.company} onChange={(v) => set("company", v)} placeholder="Maruti Suzuki" />
              <Field label="Model" value={draft.model} onChange={(v) => set("model", v)} placeholder="Swift VXi" />
              <Field label="Variant (optional)" value={draft.variant} onChange={(v) => set("variant", v)} />
              <Field label="Manufacturing year" value={draft.manufacturing_year} onChange={(v) => set("manufacturing_year", v)} type="number" placeholder={String(YEAR - 3)} />
              <Field label="Registration year (optional)" value={draft.registration_year} onChange={(v) => set("registration_year", v)} type="number" />
              <Field label="Kilometres driven" value={draft.mileage} onChange={(v) => set("mileage", v)} type="number" placeholder="45000" />
              <Picker label="Fuel type" value={draft.fuel_type} options={FUEL_TYPES} onChange={(v) => set("fuel_type", v)} />
              <Picker label="Transmission" value={draft.transmission} options={TRANSMISSIONS} onChange={(v) => set("transmission", v)} />
              <Picker label="Ownership" value={draft.ownership} options={OWNERSHIPS} onChange={(v) => set("ownership", v)} />
              <Picker label="Condition" value={draft.condition} options={CONDITIONS} onChange={(v) => set("condition", v)} />
              <Field label="Registration number (private)" value={draft.vehicle_number} onChange={(v) => set("vehicle_number", v)} placeholder="KA01AB1234" />
              <Field label="Chassis number (private)" value={draft.chassis_number} onChange={(v) => set("chassis_number", v)} />
              <Field label="Engine number (private)" value={draft.engine_number} onChange={(v) => set("engine_number", v)} />
              <p className="sm:col-span-2 flex items-start gap-2 rounded-lg bg-gold-soft p-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                Chassis, engine and registration numbers are used for verification only. Buyers see
                them masked.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <Field label="Asking price (₹)" value={draft.price} onChange={(v) => set("price", v)} type="number" placeholder="650000" />
              <Field label="Location (city, state)" value={draft.location} onChange={(v) => set("location", v)} placeholder="Pune, Maharashtra" />
              <div className="grid gap-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  rows={6}
                  maxLength={2000}
                  placeholder="Service history, accessories, recent repairs, reason for selling..."
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold">Photos ({images.length}/10)</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The first photo becomes the cover image. Max 5 MB per photo.
              </p>
              <label className="mt-5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border-gold bg-gold-soft/40 p-10 text-center">
                <ImagePlus className="h-8 w-8 text-gold-deep" />
                <span className="text-sm font-semibold">Click to add photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addImages(e.target.files)}
                />
              </label>
              <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {images.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="relative overflow-hidden rounded-lg border border-border">
                    <img src={URL.createObjectURL(f)} alt="" className="aspect-square w-full object-cover" />
                    {i === 0 && (
                      <span className="absolute left-1 top-1 rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold text-gold-foreground">
                        Cover
                      </span>
                    )}
                    <button
                      onClick={() => setImages((prev) => prev.filter((_, x) => x !== i))}
                      className="absolute right-1 top-1 rounded bg-background/90 p-1"
                      aria-label="Remove photo"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-lg font-semibold">Ownership documents</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload the RC book, insurance or ownership proof. Stored privately — visible only to
                you and CarAdda admins.
              </p>
              <label className="mt-5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border p-10 text-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-semibold">Click to add documents</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => setDocs(Array.from(e.target.files ?? []).slice(0, 5))}
                />
              </label>
              <ul className="mt-4 grid gap-2">
                {docs.map((d) => (
                  <li key={d.name} className="rounded-lg border border-border px-3 py-2 text-sm">
                    {d.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex justify-between gap-3 border-t border-border pt-6">
            <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || busy} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} className="gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={busy} className="gap-2">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit for verification
              </Button>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string | undefined;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Picker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {titleCase(o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
