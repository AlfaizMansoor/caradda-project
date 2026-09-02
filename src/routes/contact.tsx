import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, MapPin, Phone } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact CarAdda Support" },
      {
        name: "description",
        content:
          "Reach the CarAdda team for help with listings, verification, enquiries or account access.",
      },
      { property: "og:title", content: "Contact CarAdda Support" },
      { property: "og:description", content: "We reply to every message within one business day." },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  message: z.string().trim().min(10, "Tell us a little more").max(1000),
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function submit() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    toast.success("Message received — our team will reply by email");
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <SiteLayout>
      <PageHeader eyebrow="Support" title="Contact CarAdda" subtitle="Questions about a listing, verification or your account? We're here." />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {[
            [Mail, "support@caradda.in", "Email us anytime"],
            [Phone, "+91 98765 43210", "Mon–Sat, 9am to 7pm IST"],
            [MapPin, "Bengaluru, Karnataka", "Registered office"],
          ].map(([Icon, main, sub]) => {
            const I = Icon as typeof Mail;
            return (
              <div key={main as string} className="surface-panel flex items-start gap-3 p-5">
                <I className="h-9 w-9 shrink-0 rounded-lg bg-gold-soft p-2 text-gold-deep" />
                <div>
                  <p className="font-semibold">{main as string}</p>
                  <p className="text-sm text-muted-foreground">{sub as string}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="surface-panel grid gap-4 p-6">
          <div className="grid gap-2">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-email">Email</Label>
            <Input id="c-email" type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-msg">Message</Label>
            <Textarea id="c-msg" rows={6} maxLength={1000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <Button onClick={submit}>Send message</Button>
        </div>
      </div>
    </SiteLayout>
  );
}
