import type { EventInsert } from "@/server/db/schema/events";

const AIC_PLATFORM_BASE = "https://platform.aicollective.com/api/public";

interface AicEvent {
  platformId: string;
  url: string;
  format: string;
  imageUrl: string | null;
  lumaId: string;
  link: string;
  title: string;
  startAt: string;
  endAt: string | null;
  visibility: string;
  chapterId: string;
  isFeatured: boolean;
  numRsvps: number;
  timezone: string | null;
  geoLatitude: string | null;
  geoLongitude: string | null;
}

interface AicEventsResponse {
  events: AicEvent[];
  totalCount: number;
}

const FORMAT_MAP: Record<string, EventInsert["format"]> = {
  meetup: "Meetup",
  workshop: "Workshop",
  hackathon: "Hackathon",
  summit: "Summit",
  forum: "Meetup",
  online: "Online",
  social: "Social",
};

/**
 * Check if an AIC event is in the Portland metro area (~50 mile radius).
 * Portland center: 45.5152, -122.6784
 */
function isPortlandArea(ev: AicEvent): boolean {
  if (ev.geoLatitude && ev.geoLongitude) {
    const lat = parseFloat(ev.geoLatitude);
    const lng = parseFloat(ev.geoLongitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      const PDX_LAT = 45.5152;
      const PDX_LNG = -122.6784;
      const dlat = lat - PDX_LAT;
      const dlng = lng - PDX_LNG;
      const distSq = dlat * dlat + dlng * dlng;
      // ~0.72 degrees ≈ 50 miles at Portland's latitude
      return distSq < 0.72 * 0.72;
    }
  }
  // No coordinates — can't confirm Portland, exclude
  return false;
}

/**
 * Fetch upcoming Portland events from the AI Collective platform public API.
 * Falls back to including past events if no upcoming events exist.
 * Filters to Portland metro area only using geo coordinates.
 */
export async function fetchAicPortlandEvents(): Promise<EventInsert[]> {
  // Try upcoming first
  let data = await fetchFromApi("portland", true);

  // If no upcoming events, fetch recent past events so the calendar isn't empty
  if (data.events.length === 0) {
    data = await fetchFromApi("portland", false);
    console.log(
      `[Ingest] AIC Portland: no upcoming events, fetched ${data.events.length} past events`,
    );
  } else {
    console.log(
      `[Ingest] AIC Portland: fetched ${data.events.length} upcoming events`,
    );
  }

  const portlandEvents = data.events.filter(isPortlandArea);
  const filtered = data.events.length - portlandEvents.length;
  if (filtered > 0) {
    console.log(
      `[Ingest] AIC Portland: filtered out ${filtered} non-Portland events`,
    );
  }

  return portlandEvents.map(mapToEventInsert);
}

async function fetchFromApi(
  chapter: string,
  upcoming: boolean,
): Promise<AicEventsResponse> {
  const url = new URL(`${AIC_PLATFORM_BASE}/events`);
  url.searchParams.set("chapter", chapter);
  url.searchParams.set("upcoming", upcoming ? "true" : "false");
  url.searchParams.set("limit", "50");

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`AIC API returned ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

function mapToEventInsert(ev: AicEvent): EventInsert {
  const format: EventInsert["format"] = ev.format
    ? (FORMAT_MAP[ev.format.toLowerCase()] ?? "Meetup")
    : "Meetup";

  return {
    platformId: `aic-${ev.platformId}`,
    platform: "luma", // Events originate on Luma
    communitySlug: "aic-portland",
    title: ev.title,
    description: null,
    url: ev.url || ev.link,
    imageUrl: ev.imageUrl,
    format,
    startAt: new Date(ev.startAt),
    endAt: ev.endAt ? new Date(ev.endAt) : null,
    venue: null,
    formattedAddress: null,
    city: "Portland", // Only Portland-area events pass the geo-filter
    country: "US",
    latitude: ev.geoLatitude ? parseFloat(ev.geoLatitude) : null,
    longitude: ev.geoLongitude ? parseFloat(ev.geoLongitude) : null,
    timezone: ev.timezone ?? "America/Los_Angeles",
    isFeatured: ev.isFeatured,
    platformData: ev,
  };
}
