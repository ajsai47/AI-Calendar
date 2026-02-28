import type { EventInsert } from "@/server/db/schema/events";

const LUMA_API_BASE = "https://api.lu.ma";

/**
 * Luma discover feed sources for Portland AI events.
 */
const DISCOVER_SOURCES: Array<
  | { type: "category"; slug: string }
  | { type: "place"; slug: string }
  | { type: "calendar"; slug: string; communitySlug?: string }
> = [
  { type: "place", slug: "portland" },
  { type: "category", slug: "ai" },
  // AIC Portland events now come from the AIC platform API (aic.ts fetcher)
];

const FORMAT_MAP: Record<string, EventInsert["format"]> = {
  independent: "Meetup",
  meetup: "Meetup",
  workshop: "Workshop",
  hackathon: "Hackathon",
  conference: "Summit",
  course: "Workshop",
  online: "Online",
};

interface LumaDiscoverEntry {
  api_id: string;
  event: {
    api_id: string;
    name: string;
    description?: string | null;
    url?: string;
    start_at: string;
    end_at: string | null;
    timezone: string | null;
    cover_url: string | null;
    event_type: string | null;
    location_type: string | null;
    geo_address_info?: {
      city?: string;
      city_state?: string;
      address?: string;
      full_address?: string;
    } | null;
    geo_address_json?: {
      city?: string;
      description?: string;
    } | null;
    coordinate?: {
      latitude: number;
      longitude: number;
    } | null;
  };
  guest_count?: number;
  ticket_info?: {
    is_free?: boolean;
  } | null;
}

interface LumaDiscoverResponse {
  entries: LumaDiscoverEntry[];
  has_more: boolean;
  next_cursor: string | null;
}

/**
 * Resolve a Luma calendar slug (e.g. "genai-collective") to its calendar_api_id.
 */
async function resolveCalendarSlug(slug: string): Promise<string | null> {
  const res = await fetch(`${LUMA_API_BASE}/url?url=${slug}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data?.calendar?.api_id ?? null;
}

/**
 * Fetch paginated events from a Luma discover endpoint.
 */
async function fetchPaginatedEvents(
  url: string,
  maxPages = 5,
): Promise<LumaDiscoverEntry[]> {
  const allEntries: LumaDiscoverEntry[] = [];
  let cursor: string | null = null;
  let pages = 0;

  do {
    const fetchUrl = new URL(url);
    fetchUrl.searchParams.set("pagination_limit", "50");
    if (cursor) {
      fetchUrl.searchParams.set("pagination_cursor", cursor);
    }

    const res = await fetch(fetchUrl.toString());
    if (!res.ok) {
      throw new Error(`Luma API returned ${res.status}: ${res.statusText}`);
    }

    const data: LumaDiscoverResponse = await res.json();
    if (data.entries) {
      allEntries.push(...data.entries);
    }

    cursor = data.has_more ? (data.next_cursor ?? null) : null;
    pages++;
  } while (cursor && pages < maxPages);

  return allEntries;
}

/**
 * Fetch all raw entries from configured Luma discover sources,
 * deduplicating across sources (same event can appear in multiple feeds).
 * Returns entries tagged with the communitySlug when known.
 */
async function fetchAllDiscoverEntries(): Promise<
  Array<{ entry: LumaDiscoverEntry; communitySlug: string | null }>
> {
  const allEntries: Array<{
    entry: LumaDiscoverEntry;
    communitySlug: string | null;
  }> = [];
  const seenApiIds = new Set<string>();

  for (const source of DISCOVER_SOURCES) {
    try {
      let entries: LumaDiscoverEntry[] = [];
      const communitySlug =
        source.type === "calendar" ? (source.communitySlug ?? null) : null;

      if (source.type === "category") {
        entries = await fetchPaginatedEvents(
          `${LUMA_API_BASE}/discover/get-paginated-events?discover_category_slug=${source.slug}`,
        );
      } else if (source.type === "place") {
        entries = await fetchPaginatedEvents(
          `${LUMA_API_BASE}/discover/get-paginated-events?discover_place_slug=${source.slug}`,
        );
      } else if (source.type === "calendar") {
        const calendarId = await resolveCalendarSlug(source.slug);
        if (!calendarId) {
          console.warn(
            `[Ingest] Luma: could not resolve calendar slug "${source.slug}"`,
          );
          continue;
        }
        entries = await fetchPaginatedEvents(
          `${LUMA_API_BASE}/calendar/get-items?calendar_api_id=${calendarId}`,
        );
      }

      console.log(
        `[Ingest] Luma ${source.type}/${source.slug}: fetched ${entries.length} entries`,
      );

      for (const entry of entries) {
        if (!entry.event?.api_id) continue;
        if (seenApiIds.has(entry.event.api_id)) continue;
        seenApiIds.add(entry.event.api_id);
        allEntries.push({ entry, communitySlug });
      }
    } catch (error) {
      console.error(
        `[Ingest] Luma ${source.type}/${source.slug} fetch failed:`,
        error,
      );
    }
  }

  return allEntries;
}

/**
 * Fetch events from Luma discover pages (Portland place, AI category, genai-collective calendar).
 * No authentication required -- these are public APIs.
 */
export async function fetchLumaEvents(): Promise<EventInsert[]> {
  const tagged = await fetchAllDiscoverEntries();
  console.log(
    `[Ingest] Luma: ${tagged.length} unique entries to process`,
  );

  const results: EventInsert[] = [];

  for (const { entry, communitySlug } of tagged) {
    try {
      const event = entry.event;
      if (!event.name) continue;

      const eventUrl = event.url
        ? event.url.startsWith("http")
          ? event.url
          : `https://lu.ma/${event.url}`
        : `https://lu.ma/event/${event.api_id}`;

      const format: EventInsert["format"] = event.event_type
        ? (FORMAT_MAP[event.event_type.toLowerCase()] ?? "Meetup")
        : "Meetup";

      const isOnline = event.location_type === "online";

      const address =
        event.geo_address_info?.full_address ??
        event.geo_address_info?.address ??
        event.geo_address_json?.description ??
        null;

      results.push({
        platformId: `luma-${event.api_id}`,
        platform: "luma",
        communitySlug: communitySlug ?? null,
        title: event.name,
        description: event.description ?? null,
        url: eventUrl,
        imageUrl: event.cover_url ?? null,
        format: isOnline ? "Online" : format,
        startAt: new Date(event.start_at),
        endAt: event.end_at ? new Date(event.end_at) : null,
        venue: null,
        formattedAddress: address,
        city:
          event.geo_address_info?.city ??
          event.geo_address_json?.city ??
          null,
        country: null,
        latitude: event.coordinate?.latitude ?? null,
        longitude: event.coordinate?.longitude ?? null,
        timezone: event.timezone ?? null,
        isFeatured: false,
        platformData: entry,
      });
    } catch (error) {
      console.warn(
        `[Ingest] Luma: failed processing entry ${entry.event?.api_id}:`,
        error,
      );
    }
  }

  return results;
}
