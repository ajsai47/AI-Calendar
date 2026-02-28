import type { EventInsert } from "@/server/db/schema/events";

/**
 * Meetup groups to scrape for Portland AI events.
 * Key = communitySlug in our DB, value = Meetup group URL name.
 */
const MEETUP_GROUPS: Array<{ urlname: string; communitySlug: string }> = [
  { urlname: "ai-portland", communitySlug: "ai-portland" },
  { urlname: "portland-ai-engineers", communitySlug: "portland-ai-engineers" },
  { urlname: "ai-tinkerers-portland-or", communitySlug: "ai-tinkerers-pdx" },
];

interface MeetupGqlEvent {
  id: string;
  title: string;
  description?: string;
  eventUrl: string;
  dateTime: string;
  endTime?: string;
  going?: number;
  imageUrl?: string;
  eventType?: string;
  venue?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    lat?: number;
    lng?: number;
  } | null;
  group?: {
    urlname?: string;
    timezone?: string;
  };
}

interface MeetupGqlResponse {
  data?: {
    groupByUrlname?: {
      timezone?: string;
      upcomingEvents?: {
        edges?: Array<{
          node: MeetupGqlEvent;
        }>;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

/**
 * Fetch upcoming events from a single Meetup group using the public GraphQL API.
 */
async function fetchGroupEventsGql(
  urlname: string,
): Promise<MeetupGqlEvent[]> {
  const query = `
    query ($urlname: String!) {
      groupByUrlname(urlname: $urlname) {
        timezone
        upcomingEvents(input: { first: 20 }) {
          edges {
            node {
              id
              title
              description
              eventUrl
              dateTime
              endTime
              going
              imageUrl
              eventType
              venue {
                name
                address
                city
                state
                country
                lat
                lng
              }
              group {
                urlname
                timezone
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch("https://www.meetup.com/gql2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { urlname } }),
  });

  if (!res.ok) {
    throw new Error(`Meetup GQL returned ${res.status}: ${res.statusText}`);
  }

  const json: MeetupGqlResponse = await res.json();

  if (json.errors?.length) {
    throw new Error(
      `Meetup GQL errors: ${json.errors.map((e) => e.message).join(", ")}`,
    );
  }

  const edges = json.data?.groupByUrlname?.upcomingEvents?.edges ?? [];
  return edges.map((e) => ({
    ...e.node,
    group: {
      ...e.node.group,
      timezone:
        e.node.group?.timezone ?? json.data?.groupByUrlname?.timezone,
    },
  }));
}

/**
 * Fallback: scrape the public Meetup group events page HTML.
 * Meetup embeds event data in a <script id="__NEXT_DATA__"> tag.
 */
async function fetchGroupEventsHtml(
  urlname: string,
): Promise<MeetupGqlEvent[]> {
  const res = await fetch(`https://www.meetup.com/${urlname}/events/`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; AI-Calendar/1.0; +https://aicalendar.dev)",
      Accept: "text/html",
    },
  });

  if (!res.ok) {
    throw new Error(
      `Meetup HTML fetch returned ${res.status}: ${res.statusText}`,
    );
  }

  const html = await res.text();

  // Extract __NEXT_DATA__ JSON
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match?.[1]) {
    throw new Error("Could not find __NEXT_DATA__ in Meetup page");
  }

  const nextData = JSON.parse(match[1]);
  const upcomingEvents =
    nextData?.props?.pageProps?.upcomingEvents ??
    nextData?.props?.pageProps?.__APOLLO_STATE__ ??
    [];

  if (!Array.isArray(upcomingEvents)) {
    // Try to extract from Apollo cache
    const apolloState = nextData?.props?.pageProps?.__APOLLO_STATE__;
    if (apolloState) {
      const events: MeetupGqlEvent[] = [];
      for (const [key, value] of Object.entries(apolloState)) {
        if (key.startsWith("Event:") && typeof value === "object" && value !== null) {
          const ev = value as Record<string, unknown>;
          if (ev.id && ev.title && ev.dateTime) {
            events.push({
              id: ev.id as string,
              title: ev.title as string,
              description: (ev.description as string) ?? undefined,
              eventUrl:
                (ev.eventUrl as string) ??
                `https://www.meetup.com/${urlname}/events/${ev.id}/`,
              dateTime: ev.dateTime as string,
              endTime: (ev.endTime as string) ?? undefined,
              imageUrl: (ev.imageUrl as string) ?? undefined,
              eventType: (ev.eventType as string) ?? undefined,
            });
          }
        }
      }
      return events;
    }
    return [];
  }

  return upcomingEvents;
}

/**
 * Fetch upcoming events from a single Meetup group.
 * Tries GraphQL first, falls back to HTML scraping.
 */
async function fetchGroupEvents(
  urlname: string,
): Promise<MeetupGqlEvent[]> {
  try {
    const events = await fetchGroupEventsGql(urlname);
    if (events.length > 0) return events;
  } catch (error) {
    console.warn(
      `[Ingest] Meetup GQL failed for ${urlname}, trying HTML fallback:`,
      error,
    );
  }

  return fetchGroupEventsHtml(urlname);
}

function formatAddress(venue: MeetupGqlEvent["venue"]): string | null {
  if (!venue) return null;
  const parts = [venue.address, venue.city, venue.state, venue.country].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * Fetch events from all configured Meetup groups.
 */
export async function fetchMeetupEvents(): Promise<EventInsert[]> {
  const allEvents: EventInsert[] = [];

  for (const group of MEETUP_GROUPS) {
    try {
      const events = await fetchGroupEvents(group.urlname);
      console.log(
        `[Ingest] Meetup ${group.urlname}: fetched ${events.length} events`,
      );

      for (const ev of events) {
        if (!ev.title || !ev.dateTime) continue;

        const eventUrl =
          ev.eventUrl ??
          `https://www.meetup.com/${group.urlname}/events/${ev.id}/`;

        allEvents.push({
          platformId: `meetup-${ev.id}`,
          platform: "meetup",
          communitySlug: group.communitySlug,
          title: ev.title,
          description: ev.description ?? null,
          url: eventUrl,
          imageUrl: ev.imageUrl ?? null,
          format: ev.eventType === "ONLINE" ? "Online" : "Meetup",
          startAt: new Date(ev.dateTime),
          endAt: ev.endTime ? new Date(ev.endTime) : null,
          venue: ev.venue?.name ?? null,
          formattedAddress: formatAddress(ev.venue),
          city: ev.venue?.city ?? "Portland",
          country: ev.venue?.country ?? "US",
          latitude: ev.venue?.lat ?? null,
          longitude: ev.venue?.lng ?? null,
          timezone: ev.group?.timezone ?? "America/Los_Angeles",
          isFeatured: false,
          platformData: ev,
        });
      }
    } catch (error) {
      console.error(
        `[Ingest] Meetup ${group.urlname} fetch failed:`,
        error,
      );
    }
  }

  return allEvents;
}
