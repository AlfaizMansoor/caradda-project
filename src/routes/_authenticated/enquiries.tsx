import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { titleCase, type EnquiryStatus } from "@/lib/vehicles";

export const Route = createFileRoute("/_authenticated/enquiries")({
  head: () => ({
    meta: [
      { title: "Enquiries — CarAdda" },
      {
        name: "description",
        content: "Manage the enquiries you have sent and received on CarAdda listings.",
      },
      { property: "og:title", content: "Enquiries — CarAdda" },
      { property: "og:description", content: "Buyer and seller enquiry inbox." },
    ],
  }),
  component: Enquiries,
});

type EnquiryRow = {
  id: string;
  reference: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  message: string | null;
  preferred_contact: string;
  status: EnquiryStatus;
  created_at: string;
  vehicle_id: string;
  seller_id: string;
  buyer_id: string | null;
  vehicles: { company: string; model: string } | null;
};

const STATUSES: EnquiryStatus[] = ["new", "contacted", "in_progress", "closed"];

function Enquiries() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["enquiries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*, vehicles(company, model)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as EnquiryRow[];
    },
  });

  const received = (data ?? []).filter((e) => e.seller_id === user?.id);
  const sent = (data ?? []).filter((e) => e.buyer_id === user?.id && e.seller_id !== user?.id);

  async function updateStatus(id: string, status: EnquiryStatus) {
    const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Enquiry updated");
    void queryClient.invalidateQueries({ queryKey: ["enquiries"] });
  }

  return (
    <SiteLayout>
      <PageHeader eyebrow="Inbox" title="Enquiries" subtitle="Every enquiry carries a unique CarAdda reference number." />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Tabs defaultValue="received">
          <TabsList>
            <TabsTrigger value="received">Received ({received.length})</TabsTrigger>
            <TabsTrigger value="sent">Sent ({sent.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-6 grid gap-4">
            {received.length ? (
              received.map((e) => (
                <Card key={e.id} enquiry={e} manage onStatus={updateStatus} />
              ))
            ) : (
              <Empty text="No enquiries received yet." />
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-6 grid gap-4">
            {sent.length ? (
              sent.map((e) => <Card key={e.id} enquiry={e} />)
            ) : (
              <Empty text="You haven't sent any enquiries yet." />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}

function Card({
  enquiry,
  manage,
  onStatus,
}: {
  enquiry: EnquiryRow;
  manage?: boolean | undefined;
  onStatus?: ((id: string, s: EnquiryStatus) => void) | undefined;
}) {
  return (
    <div className="surface-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {enquiry.vehicles ? `${enquiry.vehicles.company} ${enquiry.vehicles.model}` : "Listing"}
          </p>
          <p className="font-mono text-xs text-muted-foreground">Ref {enquiry.reference}</p>
        </div>
        <Badge variant="secondary">{titleCase(enquiry.status.replace("_", " "))}</Badge>
      </div>

      <div className="mt-4 grid gap-1 text-sm">
        <p className="font-medium">{enquiry.buyer_name}</p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-3.5 w-3.5" /> {enquiry.buyer_phone}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-3.5 w-3.5" /> {enquiry.buyer_email}
        </p>
        <p className="text-xs text-muted-foreground">
          Prefers {enquiry.preferred_contact} · {new Date(enquiry.created_at).toLocaleDateString()}
        </p>
      </div>

      {enquiry.message && (
        <p className="mt-3 flex gap-2 rounded-lg bg-muted p-3 text-sm">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          {enquiry.message}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to="/vehicle/$id" params={{ id: enquiry.vehicle_id }}>
            View listing
          </Link>
        </Button>
        {manage && (
          <Select value={enquiry.status} onValueChange={(v) => onStatus?.(enquiry.id, v as EnquiryStatus)}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {titleCase(s.replace("_", " "))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="surface-panel grid place-items-center gap-3 p-12 text-center">
      <MessageSquare className="h-8 w-8 text-muted-foreground" />
      <p className="text-muted-foreground">{text}</p>
      <Button asChild size="sm">
        <Link to="/buy">Browse vehicles</Link>
      </Button>
    </div>
  );
}
