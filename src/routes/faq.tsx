import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs: [string, string][] = [
  [
    "Is listing a vehicle free?",
    "Yes. Creating an account, listing a vehicle and receiving enquiries on CarAdda are free.",
  ],
  [
    "How long does verification take?",
    "Most listings are reviewed within 24 hours. You get a notification the moment a listing is verified or rejected, with the reason attached.",
  ],
  [
    "Why can't I see the full registration number?",
    "Registration, chassis and engine numbers stay masked to protect sellers from document fraud. Sellers share them directly once they trust an enquiry.",
  ],
  [
    "Can I download vehicle details?",
    "Yes. Every listing has a Download PDF button that generates a branded detail sheet with photos, specifications and your enquiry reference number.",
  ],
  [
    "How do I become a seller?",
    "Open your profile and enable seller access. Once your email is verified you can publish listings straight away.",
  ],
  [
    "Does CarAdda handle payments?",
    "No. Payment and ownership transfer happen directly between buyer and seller. We never ask for a token amount on a seller's behalf.",
  ],
  [
    "How do I report a suspicious listing?",
    "Use the contact form or write to support@caradda.in with the listing link. Fraudulent listings are removed and the account suspended.",
  ],
  [
    "Will I get notified about new enquiries?",
    "Yes. Sellers get an instant in-app notification for every enquiry, and buyers are notified whenever a seller updates the status of their enquiry.",
  ],
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Buying & Selling on CarAdda" },
      {
        name: "description",
        content:
          "Answers on listing fees, verification time, masked registration details, PDF downloads and enquiry notifications.",
      },
      { property: "og:title", content: "FAQ — Buying & Selling on CarAdda" },
      {
        property: "og:description",
        content: "Common questions from CarAdda buyers and sellers, answered.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map(([q, a]) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }),
      },
    ],
  }),
  component: Faq,
});

function Faq() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Help centre"
        title="Frequently asked questions"
        subtitle="Everything buyers and sellers ask us most."
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="surface-panel px-6 py-2 sm:px-9">
          <Accordion type="single" collapsible>
            {faqs.map(([q, a], i) => (
              <AccordionItem key={q} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </SiteLayout>
  );
}
