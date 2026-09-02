import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, X, User2, LogOut, LayoutDashboard, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./NotificationBell";
import logoAsset from "@/assets/caradda-logo.png.asset.json";

const links = [
  { to: "/", label: "Home" },
  { to: "/buy", label: "Buy Vehicle" },
  { to: "/sell", label: "Sell Vehicle" },
  { to: "/categories", label: "Categories" },
  { to: "/enquiries", label: "Enquiries" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)} aria-label="CarAdda home">
      <img
        src={logoAsset.url}
        alt="CarAdda — Buy, Sell, Drive"
        width={160}
        height={160}
        className="h-11 w-auto object-contain transition-transform duration-200 hover:scale-[1.03]"
      />
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 glass-nav">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname === l.to && "text-foreground",
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          {user && <NotificationBell />}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User2 className="h-4 w-4" />
                  {profile?.full_name?.split(" ")[0] || "Account"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="space-y-0.5">
                  <p className="text-sm font-semibold">{profile?.full_name || "CarAdda user"}</p>
                  <p className="font-mono text-xs text-muted-foreground">{profile?.member_id}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/saved">
                    <Heart className="mr-2 h-4 w-4" /> Saved vehicles
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User2 className="mr-2 h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <ShieldCheck className="mr-2 h-4 w-4" /> Admin console
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth" search={{ mode: "register" }}>
                  Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-md border border-border lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border bg-card px-4 pb-5 pt-3 lg:hidden">
          <ul className="grid gap-1">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-2">
            {user ? (
              <>
                <Button asChild variant="outline" onClick={() => setOpen(false)}>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                {isAdmin && (
                  <Button asChild variant="outline" onClick={() => setOpen(false)}>
                    <Link to="/admin">Admin console</Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" onClick={() => setOpen(false)}>
                  <Link to="/auth">Login</Link>
                </Button>
                <Button asChild onClick={() => setOpen(false)}>
                  <Link to="/auth" search={{ mode: "register" }}>
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
