import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/verify-otp")({
  head: () => ({
    meta: [
      { title: "Verify Your Account — CarAdda" },
      {
        name: "description",
        content:
          "Confirm your CarAdda account with the one-time verification code sent to your email.",
      },
      { property: "og:title", content: "Verify Your Account — CarAdda" },
      { property: "og:description", content: "Enter your one-time code to activate CarAdda." },
    ],
  }),
  component: VerifyOtp,
});

function VerifyOtp() {
  const navigate = useNavigate();
  const { user, profile, refresh } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function resend() {
    if (!email) {
      toast.error("Enter your account email");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("A fresh verification code is on its way");
  }

  async function verify() {
    if (code.trim().length < 6) {
      toast.error("Enter the 6-digit code from your email");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    if (!error) {
      await supabase.from("profiles").update({ email_verified: true }).eq("id", user?.id ?? "");
      await refresh();
    }
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account verified");
    navigate({ to: "/dashboard" });
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="surface-panel p-8">
          <MailCheck className="h-11 w-11 rounded-xl bg-gold-soft p-2.5 text-gold-deep" />
          <h1 className="mt-4 text-2xl font-bold">Verify your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the one-time code we emailed you. Verified members get a trusted badge and a
            CarAdda member ID{profile?.member_id ? ` (${profile.member_id})` : ""}.
          </p>
          <div className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="v-email">Email</Label>
              <Input
                id="v-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="v-code">6-digit code</Label>
              <Input
                id="v-code"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="text-center font-mono text-lg tracking-[0.5em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <Button onClick={verify} disabled={busy} className="gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Verify account
            </Button>
            <Button variant="outline" onClick={resend} disabled={busy}>
              Resend code
            </Button>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
