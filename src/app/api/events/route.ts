import { NextRequest, NextResponse } from "next/server";
import { eq, gte, lte, and, asc } from "drizzle-orm";
import { db } from "@/server/db";
import { events, communities } from "@/server/db/schema";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 min ISR cache

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const community = params.get("community");
  const format = params.get("format");
  const from = params.get("from");
  const to = params.get("to");

  // Build filter conditions
  const conditions = [
    eq(events.status, "approved"),
    gte(events.startAt, from ? new Date(from) : new Date()),
  ];

  if (to) {
    conditions.push(lte(events.startAt, new Date(to)));
  }

  if (community) {
    conditions.push(eq(events.communitySlug, community));
  }

  if (format) {
    // Cast to the enum type
    conditions.push(
      eq(events.format, format as "Meetup" | "Workshop" | "Hackathon" | "Summit" | "Online" | "Social" | "Other"),
    );
  }

  const [eventRows, communityRows] = await Promise.all([
    db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(asc(events.startAt)),
    db.select().from(communities),
  ]);

  return NextResponse.json({ events: eventRows, communities: communityRows });
}
