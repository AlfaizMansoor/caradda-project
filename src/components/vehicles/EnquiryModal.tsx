import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { generateVehiclePdf } from "@/lib/vehicle-pdf";
import { formatPrice, type Vehicle } from "@/lib/vehicles";

const schema = z.object({
  buyer_name: z.string().trim().min(2, "Enter your name").max(100),
  buyer_phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number"),
  buyer_email: z.string().trim().email("Enter a valid email").max(255),
  message: z.string().trim().max(1000).optional(),
  preferred_contact: z.enum(["phone", "email", "whatsapp"]),
});

export function EnquiryModal({
  vehicle,
  open,
  onOpenChange,
}: {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [form, setForm] = useState({
    buyer_name: "",
    buyer_phone: "",
    buyer_email: "",
    message: "",
    preferred_contact: "phone" as "phone" | "email" | "whatsapp",
  });

  useEffect(() => {
    if (open) {
      setReference(null);
      setForm((f) => ({
        ...f,
        buyer_name: profile?.full_name || f.buyer_name,
        buyer_phone: profile?.phone || f.buyer_phone,
        buyer_email: profile?.email || user?.email || f.buyer_email,
        message: vehicle
          ? `Hi, I am interested in your ${vehicle.company} ${vehicle.model} (${vehicle.manufacturing_year}) listed at ${formatPrice(Number(vehicle.price))}. Please share more details.`
          : "",
      }));
    }
  }, [open, profile, user, vehicle]);

  async function submit() {
    if (!vehicle) return;
    if (!user) {
      toast.error("Please sign in to send an enquiry");
      onOpenChange(false);
      navigate({ to: "/auth", search: { mode: "login", redirect: `/vehicle/${vehicle.id}` } });
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("enquiries")
      .insert({
        vehicle_id: vehicle.id,
        seller_id: vehicle.seller_id ?? user.id,
        buyer_id: user.id,
        ...parsed.data,
        message: parsed.data.message || null,
      })
      .select("reference")
      .single();
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    setReference(data.reference);
    toast.success(`Enquiry sent — reference ${data.reference}`);
    void generateVehiclePdf(vehicle, {
      reference: data.reference,
      buyerName: parsed.data.buyer_name,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {reference ? "Enquiry submitted" : `Enquire about ${vehicle?.company} ${vehicle?.model}`}
          </DialogTitle>
          <DialogDescription>
            {reference
              ? "Your vehicle details PDF has been generated and downloaded automatically."
              : "The seller receives your details instantly, and we generate a downloadable vehicle detail PDF for you."}
          </DialogDescription>
        </DialogHeader>

        {reference ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border-gold bg-gold-soft p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Enquiry reference
              </p>
              <p className="font-mono text-lg font-bold">{reference}</p>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() =>
                vehicle && generateVehiclePdf(vehicle, { reference, buyerName: form.buyer_name })
              }
            >
              <Download className="h-4 w-4" /> Download PDF again
            </Button>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="buyer_name">Your name</Label>
              <Input
                id="buyer_name"
                value={form.buyer_name}
                maxLength={100}
                onChange={(e) => setForm({ ...form, buyer_name: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="buyer_phone">Phone</Label>
                <Input
                  id="buyer_phone"
                  value={form.buyer_phone}
                  maxLength={15}
                  onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="buyer_email">Email</Label>
                <Input
                  id="buyer_email"
                  type="email"
                  value={form.buyer_email}
                  maxLength={255}
                  onChange={(e) => setForm({ ...form, buyer_email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Preferred contact method</Label>
              <Select
                value={form.preferred_contact}
                onValueChange={(v) =>
                  setForm({ ...form, preferred_contact: v as typeof form.preferred_contact })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone call</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={4}
                maxLength={1000}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <Button onClick={submit} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send enquiry &amp; get PDF
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
