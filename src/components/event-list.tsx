"use client";

import { useState, useMemo, useEffect } from "react";
import {
  isToday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
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

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "this-week", label: "This Week" },
  { value: "this-month", label: "This Month" },
] as const;

type DateRange = (typeof DATE_RANGE_OPTIONS)[number]["value"];

function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-accent ${
        selected
          ? "border-foreground/30 bg-accent font-medium"
          : "border-transparent"
      }`}
    >
      {children}
    </button>
  );
}

export function EventList({ events, communities }: EventListProps) {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCommunities, setSelectedCommunities] = useState<Set<string>>(
    new Set(),
  );
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(
    new Set(),
  );
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [selectedCities, setSelectedCities] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => setMounted(true), []);

  const communityMap = useMemo(() => {
    const map = new Map<string, Community>();
    for (const c of communities) {
      map.set(c.slug, c);
    }
    return map;
  }, [communities]);

  // Derive unique cities from events
  const cityOptions = useMemo(() => {
    const cities = new Set<string>();
    for (const e of events) {
      if (e.city) cities.add(e.city);
    }
    return Array.from(cities).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    let result = events;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.venue?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q),
      );
    }

    if (selectedCommunities.size > 0) {
      result = result.filter(
        (e) => e.communitySlug && selectedCommunities.has(e.communitySlug),
      );
    }

    if (selectedFormats.size > 0) {
      result = result.filter(
        (e) => e.format && selectedFormats.has(e.format),
      );
    }

    if (dateRange === "this-week") {
      result = result.filter((e) =>
        isThisWeek(new Date(e.startAt), { weekStartsOn: 1 }),
      );
    } else if (dateRange === "this-month") {
      result = result.filter((e) => isThisMonth(new Date(e.startAt)));
    }

    if (selectedCities.size > 0) {
      result = result.filter(
        (e) => e.city && selectedCities.has(e.city),
      );
    }

    return result.sort((a, b) =>
      compareAsc(new Date(a.startAt), new Date(b.startAt)),
    );
  }, [events, search, selectedCommunities, selectedFormats, dateRange, selectedCities]);

  // Defer date grouping to client to avoid hydration mismatch
  // (server runs in UTC, client in local timezone — isToday/isTomorrow differ)
  const groups = useMemo(
    () =>
      mounted
        ? groupEventsByDate(filteredEvents)
        : [{ label: "Upcoming", events: filteredEvents }],
    [filteredEvents, mounted],
  );

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCommunities.size > 0 ||
    selectedFormats.size > 0 ||
    dateRange !== "all" ||
    selectedCities.size > 0;

  function toggleSet(
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    value: string,
  ) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }

  function clearFilters() {
    setSearch("");
    setSelectedCommunities(new Set());
    setSelectedFormats(new Set());
    setDateRange("all");
    setSelectedCities(new Set());
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter rows */}
        <div className="space-y-2">
          {/* Community */}
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
              Community
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {communities.map((c) => (
                <FilterChip
                  key={c.slug}
                  selected={selectedCommunities.has(c.slug)}
                  onClick={() => toggleSet(setSelectedCommunities, c.slug)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color ?? "#a8a29e" }}
                    />
                    {c.name}
                  </span>
                </FilterChip>
              ))}
            </div>
          </div>

          {/* Event Type */}
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
              Event Type
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {FORMAT_OPTIONS.map((f) => (
                <FilterChip
                  key={f}
                  selected={selectedFormats.has(f)}
                  onClick={() => toggleSet(setSelectedFormats, f)}
                >
                  {f}
                </FilterChip>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
              Date
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {DATE_RANGE_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  selected={dateRange === opt.value}
                  onClick={() => setDateRange(opt.value)}
                >
                  {opt.label}
                </FilterChip>
              ))}
            </div>
          </div>

          {/* City */}
          {cityOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
                City
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {cityOptions.map((city) => (
                  <FilterChip
                    key={city}
                    selected={selectedCities.has(city)}
                    onClick={() => toggleSet(setSelectedCities, city)}
                  >
                    {city}
                  </FilterChip>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 text-xs text-muted-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Clear all filters
          </Button>
        )}
      </div>

      {/* Event list */}
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
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground" suppressHydrationWarning>
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
        <p className="text-sm text-muted-foreground">
          {filteredEvents.length}{" "}
          {filteredEvents.length === 1 ? "event" : "events"}
          {hasActiveFilters ? " matching filters" : " upcoming"}
        </p>
      )}
    </div>
  );
}
