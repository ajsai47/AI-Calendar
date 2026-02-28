"use client";

import { useState, useMemo } from "react";
import {
  isToday,
  isTomorrow,
  isThisWeek,
  startOfDay,
  compareAsc,
} from "date-fns";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EventCard } from "@/components/event-card";
import type { Event } from "@/server/db/schema/events";
import type { Community } from "@/server/db/schema/communities";

interface EventListProps {
  events: Event[];
  communities: Community[];
}

interface DateGroup {
  label: string;
  events: Event[];
}

function groupEventsByDate(events: Event[]): DateGroup[] {
  const today: Event[] = [];
  const tomorrow: Event[] = [];
  const thisWeek: Event[] = [];
  const later: Event[] = [];

  for (const event of events) {
    const d = new Date(event.startAt);
    if (isToday(d)) {
      today.push(event);
    } else if (isTomorrow(d)) {
      tomorrow.push(event);
    } else if (isThisWeek(d, { weekStartsOn: 1 })) {
      thisWeek.push(event);
    } else {
      later.push(event);
    }
  }

  const groups: DateGroup[] = [];
  if (today.length > 0) groups.push({ label: "Today", events: today });
  if (tomorrow.length > 0) groups.push({ label: "Tomorrow", events: tomorrow });
  if (thisWeek.length > 0) groups.push({ label: "This Week", events: thisWeek });
  if (later.length > 0) groups.push({ label: "Later", events: later });
  return groups;
}

const FORMAT_OPTIONS = [
  "Meetup",
  "Workshop",
  "Hackathon",
  "Summit",
  "Online",
  "Social",
] as const;

export function EventList({ events, communities }: EventListProps) {
  const [search, setSearch] = useState("");
  const [selectedCommunities, setSelectedCommunities] = useState<Set<string>>(
    new Set(),
  );
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(
    new Set(),
  );

  const communityMap = useMemo(() => {
    const map = new Map<string, Community>();
    for (const c of communities) {
      map.set(c.slug, c);
    }
    return map;
  }, [communities]);

  const filteredEvents = useMemo(() => {
    let result = events;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.venue?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q),
      );
    }

    // Community filter
    if (selectedCommunities.size > 0) {
      result = result.filter(
        (e) => e.communitySlug && selectedCommunities.has(e.communitySlug),
      );
    }

    // Format filter
    if (selectedFormats.size > 0) {
      result = result.filter(
        (e) => e.format && selectedFormats.has(e.format),
      );
    }

    // Sort by start time
    return result.sort((a, b) =>
      compareAsc(new Date(a.startAt), new Date(b.startAt)),
    );
  }, [events, search, selectedCommunities, selectedFormats]);

  const groups = useMemo(
    () => groupEventsByDate(filteredEvents),
    [filteredEvents],
  );

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCommunities.size > 0 ||
    selectedFormats.size > 0;

  function toggleCommunity(slug: string) {
    setSelectedCommunities((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  function toggleFormat(format: string) {
    setSelectedFormats((prev) => {
      const next = new Set(prev);
      if (next.has(format)) {
        next.delete(format);
      } else {
        next.add(format);
      }
      return next;
    });
  }

  function clearFilters() {
    setSearch("");
    setSelectedCommunities(new Set());
    setSelectedFormats(new Set());
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
      {/* Sidebar filters */}
      <aside className="w-full shrink-0 lg:w-56">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Community filters */}
        {communities.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Communities
            </h3>
            <div className="flex flex-row flex-wrap gap-1.5 lg:flex-col lg:gap-0">
              {communities.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => toggleCommunity(c.slug)}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
                    selectedCommunities.has(c.slug)
                      ? "bg-accent font-medium"
                      : ""
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color ?? "#a8a29e" }}
                  />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Format filters */}
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Format
          </h3>
          <div className="flex flex-row flex-wrap gap-1.5 lg:flex-col lg:gap-0">
            {FORMAT_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => toggleFormat(f)}
                className={`rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
                  selectedFormats.has(f) ? "bg-accent font-medium" : ""
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="mt-4 w-full justify-start text-muted-foreground"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </aside>

      {/* Event list */}
      <main className="min-w-0 flex-1">
        {groups.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            {hasActiveFilters
              ? "No events match your filters."
              : "No upcoming events."}
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.label}>
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h2>
                <Separator className="mb-2" />
                <div className="divide-y">
                  {group.events.map((event) => (
                    <EventCard
                      key={event.platformId}
                      event={event}
                      community={
                        event.communitySlug
                          ? communityMap.get(event.communitySlug) ?? null
                          : null
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Total count */}
        {filteredEvents.length > 0 && (
          <p className="mt-8 text-sm text-muted-foreground">
            {filteredEvents.length}{" "}
            {filteredEvents.length === 1 ? "event" : "events"}
            {hasActiveFilters ? " matching filters" : " upcoming"}
          </p>
        )}
      </main>
    </div>
  );
}
