import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AuthSearch = { mode?: "login" | "register" | "forgot" | undefined; redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    const mode = search["mode"];
    const redirect = search["redirect"];
    return {
      mode:
        mode === "register" || mode === "forgot" || mode === "login"
          ? (mode as AuthSearch["mode"])
          : undefined,
      redirect: typeof redirect === "string" && redirect.startsWith("/") ? redirect : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Login or Register — CarAdda" },
      {
        name: "description",
        content:
          "Sign in to CarAdda to save vehicles, send enquiries, download detail PDFs and manage your listings.",
      },
      { property: "og:title", content: "Login or Register — CarAdda" },
      { property: "og:description", content: "Secure access to your CarAdda account." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

function AuthPage() {
  const { mode, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"login" | "register" | "forgot">(mode ?? "login");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  const [login, setLogin] = useState({ email: "", password: "" });
  const [reg, setReg] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: redirect ?? "/dashboard", replace: true });
  }, [user, loading, navigate, redirect]);

  async function doLogin() {
    const email = emailSchema.safeParse(login.email);
    if (!email.success) { toast.error(email.error.issues[0]!.message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.data,
      password: login.password,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back to CarAdda");
    navigate({ to: redirect ?? "/dashboard" });
  }

  async function doRegister() {
    const parsed = z
      .object({
        full_name: z.string().trim().min(2, "Enter your full name").max(100),
        email: emailSchema,
        phone: z
          .string()
          .trim()
          .regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid mobile number"),
        password: passwordSchema,
      })
      .safeParse(reg);
    if (!parsed.success) { toast.error(parsed.error.issues[0]!.message); return; }

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (!data.session) {
      setSent("confirm");
      toast.success("Check your email to confirm your CarAdda account");
      return;
    }
    toast.success("Account created");
    navigate({ to: "/verify-otp" });
  }

  async function doForgot() {
    const email = emailSchema.safeParse(forgotEmail);
    if (!email.success) { toast.error(email.error.issues[0]!.message); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSent("reset");
    toast.success("Password reset link sent");
  }

  return (
    <SiteLayout>
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
        <div className="hidden lg:block">
          <h1 className="text-4xl font-bold leading-tight">
            One CarAdda account for <span className="text-gold-deep">buying and selling</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Every account receives a unique CarAdda member ID, email verification and a
            role-based dashboard for buyers, sellers and administrators.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              ["Unique member ID", "Format CA-XXXXXXXX, generated automatically at signup."],
              ["Verified contact", "Email confirmation plus a one-time code for your mobile."],
              ["Role-based access", "Buyer, seller and admin dashboards with strict data rules."],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-panel p-6 sm:p-8">
          {sent ? (
            <div className="grid gap-4 text-center">
              <Mail className="mx-auto h-12 w-12 rounded-xl bg-gold-soft p-3 text-gold-deep" />
              <h2 className="text-xl font-semibold">
                {sent === "confirm" ? "Confirm your email" : "Reset link sent"}
              </h2>
              <p className="text-sm text-muted-foreground">
                We&apos;ve emailed you a secure link. Open it to
                {sent === "confirm"
                  ? " activate your CarAdda account."
                  : " choose a new password."}
              </p>
              <Button variant="outline" onClick={() => setSent(null)}>
                Back
              </Button>
            </div>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="forgot">Reset</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6 grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="l-email">Email</Label>
                  <Input
                    id="l-email"
                    type="email"
                    value={login.email}
                    onChange={(e) => setLogin({ ...login, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="l-pass">Password</Label>
                  <Input
                    id="l-pass"
                    type="password"
                    value={login.password}
                    onChange={(e) => setLogin({ ...login, password: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && doLogin()}
                  />
                </div>
                <Button onClick={doLogin} disabled={busy} className="gap-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Login
                </Button>
                <button
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => setTab("forgot")}
                >
                  Forgot password?
                </button>
              </TabsContent>

              <TabsContent value="register" className="mt-6 grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="r-name">Full name</Label>
                  <Input
                    id="r-name"
                    maxLength={100}
                    value={reg.full_name}
                    onChange={(e) => setReg({ ...reg, full_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="r-mobile">Mobile number</Label>
                  <Input
                    id="r-mobile"
                    maxLength={15}
                    placeholder="+91 98765 43210"
                    value={reg.phone}
                    onChange={(e) => setReg({ ...reg, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="r-email">Email</Label>
                  <Input
                    id="r-email"
                    type="email"
                    value={reg.email}
                    onChange={(e) => setReg({ ...reg, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="r-pass">Password</Label>
                  <Input
                    id="r-pass"
                    type="password"
                    value={reg.password}
                    onChange={(e) => setReg({ ...reg, password: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
                </div>
                <Button onClick={doRegister} disabled={busy} className="gap-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create account
                </Button>
                <p className="text-xs text-muted-foreground">
                  By registering you agree to our{" "}
                  <Link to="/terms" className="underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </TabsContent>

              <TabsContent value="forgot" className="mt-6 grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="f-email">Account email</Label>
                  <Input
                    id="f-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
                <Button onClick={doForgot} disabled={busy} className="gap-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
