import { createServiceClient } from "@/lib/supabase/service";

const allowedEvents = new Set([
  "page_view",
  "view_item",
  "add_to_cart",
  "begin_checkout",
  "purchase",
  "order_complete",
  "cta_click",
]);

const clean = (value: unknown, max = 160) =>
  typeof value === "string" ? value.slice(0, max) : null;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const eventName = clean(body.eventName, 80);
    if (!eventName || !allowedEvents.has(eventName)) return Response.json({ error: "Invalid event" }, { status: 400 });
    const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
    const supabase = createServiceClient();
    const { error } = await supabase.from("analytics_events").insert({
      event_name: eventName,
      session_id: clean(body.sessionId, 100),
      path: clean(body.path, 500),
      referrer: clean(body.referrer, 500),
      utm_source: clean(body.utmSource),
      utm_medium: clean(body.utmMedium),
      utm_campaign: clean(body.utmCampaign),
      utm_content: clean(body.utmContent),
      utm_term: clean(body.utmTerm),
      gclid: clean(body.gclid, 200),
      fbclid: clean(body.fbclid, 200),
      metadata,
    });
    if (error) return Response.json({ error: "Unable to record event" }, { status: 500 });
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid analytics payload" }, { status: 400 });
  }
}
