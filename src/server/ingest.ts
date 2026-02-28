import { sql } from "drizzle-orm";

import { fetchLumaEvents } from "@/lib/fetchers/luma";
import { fetchMeetupEvents } from "@/lib/fetchers/meetup";
import { db } from "@/server/db";
import { events } from "@/server/db/schema";
import type { EventInsert } from "@/server/db/schema/events";

export interface IngestionStats {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Ingest events from all external sources (Luma, Meetup) into the events table.
 * Simplified for hackathon MVP -- no internal/external event split, just one table.
 */
export async function ingestExternalEvents(): Promise<IngestionStats> {
  const stats: IngestionStats = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  // Fetch from all sources in parallel
  const [lumaResult, meetupResult] = await Promise.allSettled([
    fetchLumaEvents(),
    fetchMeetupEvents(),
  ]);

  const allEvents: EventInsert[] = [];

  if (lumaResult.status === "fulfilled") {
    allEvents.push(...lumaResult.value);
    console.log(`[Ingest] Fetched ${lumaResult.value.length} Luma events`);
  } else {
    const msg = `Luma fetch failed: ${lumaResult.reason}`;
    console.error(`[Ingest] ${msg}`);
    stats.errors.push(msg);
  }

  if (meetupResult.status === "fulfilled") {
    allEvents.push(...meetupResult.value);
    console.log(`[Ingest] Fetched ${meetupResult.value.length} Meetup events`);
  } else {
    const msg = `Meetup fetch failed: ${meetupResult.reason}`;
    console.error(`[Ingest] ${msg}`);
    stats.errors.push(msg);
  }

  // Filter out past events
  const now = new Date();
  const futureEvents = allEvents.filter((e) => e.startAt >= now);
  stats.skipped += allEvents.length - futureEvents.length;

  if (futureEvents.length === 0) {
    console.log("[Ingest] No future events to upsert");
    return stats;
  }

  // Within-batch URL dedup: keep first seen per URL
  const urlMap = new Map<string, EventInsert>();
  let dedupSkipped = 0;

  for (const event of futureEvents) {
    const normalizedUrl = event.url.toLowerCase().replace(/\/+$/, "");
    if (!urlMap.has(normalizedUrl)) {
      urlMap.set(normalizedUrl, event);
    } else {
      dedupSkipped++;
    }
  }

  stats.skipped += dedupSkipped;
  const dedupedEvents = [...urlMap.values()];

  if (dedupSkipped > 0) {
    console.log(
      `[Ingest] URL dedup: skipped ${dedupSkipped} duplicates within batch`,
    );
  }

  if (dedupedEvents.length === 0) {
    console.log("[Ingest] All events deduplicated, nothing to upsert");
    return stats;
  }

  // Batch upsert -- on conflict by platformId, update mutable fields
  const BATCH_SIZE = 100;
  for (let i = 0; i < dedupedEvents.length; i += BATCH_SIZE) {
    const batch = dedupedEvents.slice(i, i + BATCH_SIZE);
    try {
      await db
        .insert(events)
        .values(batch)
        .onConflictDoUpdate({
          target: events.platformId,
          set: {
            title: sql`excluded.title`,
            description: sql`excluded.description`,
            url: sql`excluded.url`,
            imageUrl: sql`excluded.image_url`,
            format: sql`excluded.format`,
            startAt: sql`excluded.start_at`,
            endAt: sql`excluded.end_at`,
            venue: sql`excluded.venue`,
            formattedAddress: sql`excluded.formatted_address`,
            city: sql`excluded.city`,
            country: sql`excluded.country`,
            latitude: sql`excluded.latitude`,
            longitude: sql`excluded.longitude`,
            timezone: sql`excluded.timezone`,
            communitySlug: sql`excluded.community_slug`,
            isFeatured: sql`excluded.is_featured`,
            platformData: sql`excluded.platform_data`,
            updatedAt: new Date(),
          },
        });
      stats.inserted += batch.length;
    } catch (error) {
      const msg = `Batch upsert failed (offset ${i}): ${error}`;
      console.error(`[Ingest] ${msg}`);
      stats.errors.push(msg);
    }
  }

  console.log(
    `[Ingest] Done: inserted/updated=${stats.inserted}, skipped=${stats.skipped}, errors=${stats.errors.length}`,
  );

  return stats;
}
