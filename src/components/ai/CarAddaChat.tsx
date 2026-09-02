import { useEffect, useRef, useState } from "react";
import { Bot, RefreshCw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserLocation } from "@/hooks/useUserLocation";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Find vehicles near me",
  "Best SUV under ₹10 lakh",
  "Compare these vehicles",
  "Tell me about this vehicle",
];

export function CarAddaChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const { location } = useUserLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string, history?: Msg[]) {
    const prompt = text.trim();
    if (!prompt || loading) return;
    const base = history ?? messages;
    const next = [...base, { role: "user" as const, content: prompt }];
    setMessages(next);
    setInput("");
    setLastPrompt(prompt);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: next,
          location: location ? `${location.city}${location.state ? `, ${location.state}` : ""}` : null,
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setMessages([...next, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Network error — Vahaan Saathi could not be reached.");
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    if (!lastPrompt) return;
    const history = messages.slice(0, -1);
    setMessages(history);
    void send(lastPrompt, history);
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Vahaan Saathi" : "Open Vahaan Saathi"}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-gold)] transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        <span className="hidden sm:inline">{open ? "Close" : "Vahaan Saathi"}</span>
      </button>

      {open && (
        <div
          className="chat-panel-in fixed bottom-20 right-3 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card-hover)] sm:right-5 sm:w-[380px]"
          role="dialog"
          aria-label="Vahaan Saathi chat"
        >
          <header className="flex items-center gap-2 border-b border-border bg-gold-soft px-4 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Vahaan Saathi</p>
              <p className="text-xs text-muted-foreground">Vehicle expert & listing search</p>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Ask me about specs, mileage, comparisons or vehicles listed on CarAdda.
                </p>
                <div className="grid gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      className="rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:border-border-gold hover:bg-gold-soft"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("fade-in-up flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-foreground",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-1.5 rounded-2xl bg-surface px-3.5 py-3 w-fit">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <p>{error}</p>
                <Button size="sm" variant="outline" className="mt-2 gap-1.5" onClick={retry}>
                  <RefreshCw className="h-3.5 w-3.5" /> Retry
                </Button>
              </div>
            )}
          </div>

          <form
            className="flex items-center gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Vahaan Saathi…"
              aria-label="Message Vahaan Saathi"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
