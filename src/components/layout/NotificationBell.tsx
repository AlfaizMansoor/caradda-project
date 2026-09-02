import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, link, read, created_at")
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!user) return null;

  const items = data ?? [];
  const unread = items.filter((n) => !n.read).length;

  async function markAllRead() {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function open(n: Notification) {
    if (!n.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    if (n.link) navigate({ to: n.link as "/enquiries" });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm">Notifications</DropdownMenuLabel>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-gold-deep"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => void open(n)}
                className={cn(
                  "block w-full border-b border-border px-3 py-3 text-left last:border-0 hover:bg-accent",
                  !n.read && "bg-gold-soft/60",
                )}
              >
                <p className="text-sm font-semibold">{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("en-IN")}
                </p>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
