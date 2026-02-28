import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/server/db";
import { events } from "@/server/db/schema/events";
import { gte, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

export async function POST(request: Request) {
  try {
    const { messages }: ChatRequest = await request.json();

    if (!messages?.length) {
      return Response.json({ error: "No messages provided" }, { status: 400 });
    }

    // Fetch current events for context
    const now = new Date();
    const upcomingEvents = await db
      .select({
        title: events.title,
        description: events.description,
        url: events.url,
        format: events.format,
        startAt: events.startAt,
        endAt: events.endAt,
        venue: events.venue,
        formattedAddress: events.formattedAddress,
        city: events.city,
        communitySlug: events.communitySlug,
      })
      .from(events)
      .where(gte(events.startAt, now))
      .orderBy(asc(events.startAt))
      .limit(50);

    const eventsContext = upcomingEvents
      .map((e) => {
        const start = new Date(e.startAt);
        const parts = [
          `- "${e.title}"`,
          `  Date: ${start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`,
          `  Time: ${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
          e.endAt
            ? `  End: ${new Date(e.endAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
            : null,
          e.format ? `  Format: ${e.format}` : null,
          e.venue ? `  Venue: ${e.venue}` : null,
          e.formattedAddress ? `  Address: ${e.formattedAddress}` : null,
          e.city ? `  City: ${e.city}` : null,
          e.communitySlug ? `  Community: ${e.communitySlug}` : null,
          e.url ? `  Link: ${e.url}` : null,
          e.description
            ? `  Description: ${e.description.slice(0, 200)}${e.description.length > 200 ? "..." : ""}`
            : null,
        ];
        return parts.filter(Boolean).join("\n");
      })
      .join("\n\n");

    const systemPrompt = `You are an AI events assistant for the Portland, Oregon AI community calendar. You help users find events, get recommendations, and learn about the local AI community scene.

Today's date is ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.

Here are the upcoming events:

${eventsContext}

Guidelines:
- Be concise and helpful. Keep responses under 3-4 sentences unless the user asks for details.
- When recommending events, include the event name, date/time, and location.
- If an event has a URL, mention they can click the event in the calendar to RSVP.
- If asked about something not in the event data, say you don't have that information but suggest checking the calendar.
- Be conversational and friendly — you're a local Portland AI community guide.
- When listing multiple events, use a brief format with name, date, and key details.`;

    // Stream the response
    const stream = await anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Convert to a readable stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`),
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 },
    );
  }
}
