import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, FileDown, Gauge, Lock, Users } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About CarAdda — Trusted Vehicle Marketplace" },
      {
        name: "description",
        content:
          "CarAdda is a multi-vehicle marketplace for cars, bikes, trucks, tractors and commercial vehicles with admin-verified listings.",
      },
      { property: "og:title", content: "About CarAdda" },
      { property: "og:description", content: "How CarAdda verifies every vehicle listing." },
    ],
  }),
  component: About,
});

const pillars = [
  { icon: BadgeCheck, title: "Admin verification", body: "No listing goes live until our team reviews the vehicle documents and seller identity." },
  { icon: Lock, title: "Private by design", body: "Chassis, engine and registration documents are stored privately and never exposed to buyers." },
  { icon: FileDown, title: "Buyer PDF reports", body: "Download a branded vehicle detail report with specifications and your enquiry reference." },
  { icon: Users, title: "Member IDs", body: "Every account gets a unique CarAdda ID for accountable buying and selling." },
  { icon: Gauge, title: "Seven categories", body: "Cars, bikes, trucks, buses, tractors, commercial and other vehicles in one place." },
];

function About() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="About us"
        title="A marketplace built on verification"
        subtitle="CarAdda brings structure and trust to India's used-vehicle trade — across every vehicle type."
      />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {pillars.map((p) => (
            <div key={p.title} className="surface-panel p-6">
              <p.icon className="h-9 w-9 rounded-lg bg-gold-soft p-2 text-gold-deep" />
              <h2 className="mt-4 text-lg font-semibold">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
        <div className="surface-panel mt-10 flex flex-col items-center gap-4 p-10 text-center">
          <h2 className="text-2xl font-bold">Ready to list your vehicle?</h2>
          <p className="max-w-xl text-muted-foreground">
            Create a free account, complete the guided listing form and our admins will verify your
            vehicle before it goes live.
          </p>
          <Button asChild size="lg">
            <Link to="/sell">Start selling</Link>
          </Button>
        </div>
      </div>
    </SiteLayout>
  );
}
