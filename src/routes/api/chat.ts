import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "user" | "assistant"; content: string };

type Body = { messages?: ChatMessage[]; location?: string | null };

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash";

const SYSTEM = `You are "Vahaan Saathi", the assistant of the CarAdda vehicle marketplace (India).
You help users with vehicle specifications, mileage, fuel type, transmission, comparisons,
used-vehicle buying guidance and questions about vehicles listed on CarAdda.
When the user asks about vehicles available on CarAdda, ONLY use listings from the
"CARADDA LIVE LISTINGS" context provided in the conversation. Never invent listings,
prices or sellers. If nothing matches, say so and suggest widening the filters.
Prices are in Indian Rupees. Be concise, friendly and practical. Use markdown-free plain text
with short bullet lines when listing vehicles.`;

async function buildListingContext(query: string, location: string | null) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("vehicles")
      .select(
        "company, model, variant, category, price, manufacturing_year, mileage, fuel_type, transmission, ownership, location, condition",
      )
      .eq("status", "active")
      .eq("verification_status", "verified")
      .limit(40);

    if (location) q = q.ilike("location", `%${location}%`);
    const { data } = await q;

    let rows = data ?? [];
    if (!rows.length && location) {
      const { data: fallback } = await supabaseAdmin
        .from("vehicles")
        .select(
          "company, model, variant, category, price, manufacturing_year, mileage, fuel_type, transmission, ownership, location, condition",
        )
        .eq("status", "active")
        .eq("verification_status", "verified")
        .limit(40);
      rows = fallback ?? [];
    }
    if (!rows.length) return "CARADDA LIVE LISTINGS: (none available right now)";

    const lines = rows.map(
      (v) =>
        `- ${v.manufacturing_year} ${v.company} ${v.model}${v.variant ? ` ${v.variant}` : ""} | ${v.category} | ₹${Number(v.price).toLocaleString("en-IN")} | ${Number(v.mileage).toLocaleString("en-IN")} km | ${v.fuel_type} | ${v.transmission} | ${v.ownership} owner | ${v.location} | condition: ${v.condition}`,
    );
    return `CARADDA LIVE LISTINGS (user query: ${query.slice(0, 200)}):\n${lines.join("\n")}`;
  } catch {
    return "CARADDA LIVE LISTINGS: (unavailable)";
  }
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Body;
        const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
        if (!messages.length) {
          return Response.json({ error: "No message provided." }, { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return Response.json(
            { error: "Vahaan Saathi is not configured (missing AI key)." },
            { status: 500 },
          );
        }

        const last = messages[messages.length - 1]?.content ?? "";
        const listings = await buildListingContext(last, body.location ?? null);

        try {
          const res = await fetch(GATEWAY_URL, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
              model: MODEL,
              messages: [
                { role: "system", content: SYSTEM },
                { role: "system", content: listings },
                ...(body.location
                  ? [{ role: "system", content: `User's location: ${body.location}` }]
                  : []),
                ...messages,
              ],
            }),
          });

          if (!res.ok) {
            const text = await res.text().catch(() => "");
            let detail = text.slice(0, 200);
            try {
              const parsed = JSON.parse(text) as { error?: { message?: string }; message?: string };
              detail = parsed.error?.message ?? parsed.message ?? detail;
            } catch {
              /* keep raw text */
            }
            return Response.json(
              { error: `Vahaan Saathi service error (${res.status}). ${detail}` },
              { status: 502 },
            );
          }

          const data = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const reply = data.choices?.[0]?.message?.content?.trim();
          if (!reply) {
            return Response.json(
              { error: "Vahaan Saathi returned an empty reply." },
              { status: 502 },
            );
          }
          return Response.json({ reply });
        } catch (err) {
          console.error("ai chat failed", err);
          return Response.json(
            { error: "Could not reach Vahaan Saathi. Please try again in a moment." },
            { status: 502 },
          );
        }
      },
    },
  },
});
