import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — CarAdda" },
      {
        name: "description",
        content:
          "How CarAdda collects, stores and protects seller documents, buyer enquiries and account data.",
      },
      { property: "og:title", content: "Privacy Policy — CarAdda" },
      { property: "og:description", content: "Our commitments on data handling and privacy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Privacy,
});

const sections: [string, string[]][] = [
  [
    "1. Information we collect",
    [
      "Account data: your name, email address, mobile number, city and state, plus the unique CarAdda member ID issued to you at sign-up.",
      "Listing data: vehicle specifications, price, location, photographs, and private identifiers such as registration, chassis and engine numbers submitted for verification.",
      "Verification documents: RC book, insurance and ownership proofs uploaded by sellers.",
      "Usage data: pages visited, searches run and enquiries sent, used to improve the marketplace.",
    ],
  ],
  [
    "2. How your documents are stored",
    [
      "Seller documents live in a private storage area. Only the uploading seller and CarAdda administrators can open them.",
      "They are never shown to buyers, never included in downloadable PDF reports and never returned by public queries.",
      "Photographs are only publicly readable while the linked listing is both active and verified.",
    ],
  ],
  [
    "3. What buyers can see",
    [
      "Buyers see specifications, photos, price, location and the seller's display name, city and verification status.",
      "Chassis numbers, engine numbers and full registration numbers stay masked until the seller chooses to share them directly.",
    ],
  ],
  [
    "4. Enquiries and notifications",
    [
      "When you send an enquiry, your name, phone and email are shared with that seller so they can respond.",
      "Enquiry records are visible only to you, the seller and CarAdda administrators.",
      "We send in-app notifications — and, where you have opted in, email notifications — for new enquiries, enquiry status changes and listing verification outcomes.",
    ],
  ],
  [
    "5. Legal basis and retention",
    [
      "We process your data to deliver the marketplace service you requested, to prevent fraud, and to meet legal obligations.",
      "Listing and enquiry records are retained while your account is active and for a reasonable period afterwards for dispute resolution.",
    ],
  ],
  [
    "6. Sharing with third parties",
    [
      "We do not sell personal data. Data is shared only with infrastructure providers who host the platform, and with authorities where legally required.",
    ],
  ],
  [
    "7. Security",
    [
      "Access to every record is enforced at the database level with row-level security, so one account can never read another account's private data.",
      "Passwords are hashed by our authentication provider and never visible to CarAdda staff.",
    ],
  ],
  [
    "8. Your rights",
    [
      "You may access and correct your profile at any time, delete your listings, withdraw an enquiry, or request full account deletion.",
      "Write to support@caradda.in and we will action verified requests within 30 days.",
    ],
  ],
  [
    "9. Children",
    ["CarAdda is not intended for anyone under 18. We do not knowingly collect data from minors."],
  ],
  [
    "10. Contact",
    ["Questions about this policy? Email support@caradda.in or use the contact form on this site."],
  ],
];

function Privacy() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="How we handle your data. Last updated 19 August 2026."
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="surface-panel space-y-9 p-6 sm:p-9">
          {sections.map(([h, items]) => (
            <section key={h}>
              <h2 className="text-lg font-semibold">{h}</h2>
              <ul className="mt-3 space-y-2">
                {items.map((b) => (
                  <li key={b} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {b}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
