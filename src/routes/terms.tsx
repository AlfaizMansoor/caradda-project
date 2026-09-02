import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — CarAdda" },
      {
        name: "description",
        content:
          "The rules for listing, buying and enquiring about vehicles on the CarAdda marketplace.",
      },
      { property: "og:title", content: "Terms & Conditions — CarAdda" },
      { property: "og:description", content: "Marketplace rules for buyers and sellers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Terms,
});

const sections: [string, string[]][] = [
  [
    "1. Marketplace role",
    [
      "CarAdda is a listing and discovery platform. We verify submitted documents to the best of our ability but we are not a party to any sale agreement between a buyer and a seller.",
      "Price negotiation, inspection, payment and transfer of ownership happen directly between the two parties.",
    ],
  ],
  [
    "2. Accounts and member IDs",
    [
      "Every account receives a unique CarAdda member ID. You must give accurate details and keep your credentials confidential.",
      "Email verification is required before a listing can be submitted. One person may not operate multiple accounts to evade moderation.",
    ],
  ],
  [
    "3. Seller obligations",
    [
      "Sellers must own the vehicle listed or be authorised to sell it, and must upload genuine ownership documents.",
      "Specifications, mileage, ownership count and accident history must be stated accurately.",
      "A maximum of 10 photographs per listing, all of the actual vehicle. Stock or misleading imagery is removed.",
      "Fraudulent listings are taken down and the account suspended without refund of any fees.",
    ],
  ],
  [
    "4. Verification",
    [
      "Every listing is reviewed by an administrator before it appears publicly.",
      "Verification confirms document consistency only; it is not a mechanical inspection, valuation or warranty.",
      "Rejected listings show the reason so the seller can correct and resubmit.",
    ],
  ],
  [
    "5. Buyer conduct",
    [
      "Buyers must provide genuine contact details when enquiring.",
      "Misuse of seller contact information for spam, resale of data or harassment leads to permanent removal.",
      "Always inspect a vehicle and verify documents in person before paying any amount.",
    ],
  ],
  [
    "6. Prohibited listings",
    [
      "Stolen, financed-without-disclosure, scrapped or non-transferable vehicles.",
      "Vehicles under legal dispute, or listings that misstate registration details.",
    ],
  ],
  [
    "7. Downloadable reports",
    [
      "PDF vehicle reports are generated for buyer convenience from listing data.",
      "They carry no legal warranty and deliberately exclude private document details.",
    ],
  ],
  [
    "8. Payments",
    [
      "CarAdda does not process vehicle payments and never asks for a token amount on a seller's behalf. Any such request is a scam — report it to support@caradda.in.",
    ],
  ],
  [
    "9. Liability",
    [
      "To the extent permitted by law, CarAdda is not liable for losses arising from a transaction between users, or from inaccurate information supplied by a user.",
    ],
  ],
  [
    "10. Termination and changes",
    [
      "We may suspend accounts that breach these terms and may update the terms from time to time.",
      "Continued use of CarAdda constitutes acceptance of the current version. Governing law: India.",
    ],
  ],
];

function Terms() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Legal"
        title="Terms & Conditions"
        subtitle="The rules of the marketplace. Last updated 19 August 2026."
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
