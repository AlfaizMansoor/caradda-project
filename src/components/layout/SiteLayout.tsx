import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
