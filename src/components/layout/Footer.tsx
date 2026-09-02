import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { Logo } from "./Navbar";

const socials = [Facebook, Instagram, Twitter, Linkedin, Youtube];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="h-px w-full gold-rule" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Your trusted marketplace for buying and selling vehicles — cars, bikes, trucks,
            tractors, buses and commercial vehicles, all verified before they go live.
          </p>
          <div className="mt-5 flex gap-2">
            {socials.map((Icon, i) => (
              <span
                key={i}
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-border-gold hover:text-gold-deep"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Marketplace</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link to="/buy" className="hover:text-gold-deep">
                Buy Vehicles
              </Link>
            </li>
            <li>
              <Link to="/sell" className="hover:text-gold-deep">
                Sell Vehicle
              </Link>
            </li>
            <li>
              <Link to="/categories" className="hover:text-gold-deep">
                Categories
              </Link>
            </li>
            <li>
              <Link to="/enquiries" className="hover:text-gold-deep">
                Enquiries
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-gold-deep">
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-gold-deep">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-gold-deep">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-gold-deep">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link to="/cookies" className="hover:text-gold-deep">
                Cookie Policy
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-gold-deep">
                FAQ
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} CarAdda. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
