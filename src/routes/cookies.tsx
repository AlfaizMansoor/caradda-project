import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — CarAdda" },
      {
        name: "description",
        content:
          "Which cookies and local storage CarAdda uses to keep you signed in and improve search.",
      },
      { property: "og:title", content: "Cookie Policy — CarAdda" },
      { property: "og:description", content: "How CarAdda uses cookies and local storage." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Cookies,
});

const rows: [string, string, string][] = [
  ["Session storage", "Essential", "Keeps you signed in and remembers your member ID between visits."],
  ["Search preferences", "Functional", "Remembers your last category, sort order and grid/list view."],
  ["Security tokens", "Essential", "Protects forms and enquiry submissions against abuse."],
  ["Aggregated usage", "Analytics", "Counts page views to see which categories need more listings."],
];

function Cookies() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Legal"
        title="Cookie Policy"
        subtitle="Small files that keep CarAdda working. Last updated 19 August 2026."
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
        <div className="surface-panel p-6 sm:p-9">
          <p className="text-sm leading-relaxed text-muted-foreground">
            CarAdda uses cookies and browser local storage only where they are needed to run the
            marketplace. We do not use advertising cookies and we do not sell your browsing data.
          </p>
          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 font-semibold">What</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Why</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([what, type, why]) => (
                  <tr key={what} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{what}</td>
                    <td className="px-4 py-3 text-muted-foreground">{type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            You can clear cookies at any time in your browser settings. Removing essential cookies
            will sign you out and reset saved preferences.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
