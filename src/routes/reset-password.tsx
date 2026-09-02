import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — CarAdda" },
      { name: "description", content: "Choose a new password for your CarAdda account." },
      { property: "og:title", content: "Reset Password — CarAdda" },
      { property: "og:description", content: "Set a new CarAdda account password securely." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="surface-panel p-8">
          <KeyRound className="h-11 w-11 rounded-xl bg-gold-soft p-2.5 text-gold-deep" />
          <h1 className="mt-4 text-2xl font-bold">Set a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Open this page from the reset link in your email, then choose a new password.
          </p>
          <div className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="p1">New password</Label>
              <Input
                id="p1"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p2">Confirm password</Label>
              <Input
                id="p2"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button onClick={submit} disabled={busy} className="gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password
            </Button>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
