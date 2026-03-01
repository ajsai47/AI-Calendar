"use client";

import { useState, useMemo, useEffect } from "react";
import {
  isToday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  compareAsc,
} from "date-fns";
import {
  Search,
  X,
  ChevronDown,
  Check,
  Users,
  Tag,
  CalendarDays,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  { value: "all", label: "All Dates" },
  { value: "this-week", label: "This Week" },
  { value: "this-month", label: "This Month" },
] as const;

type DateRange = (typeof DATE_RANGE_OPTIONS)[number]["value"];

function FilterDropdown({
  label,
  icon: Icon,
  selectedCount,
  children,
}: {
  label: string;
  icon: React.ElementType;
  selectedCount: number;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{label}</span>
          {selectedCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background">
              {selectedCount}
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1">
        {children}
      </PopoverContent>
    </Popover>
  );
}

function DropdownItem({
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
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          selected
            ? "border-foreground bg-foreground text-background"
            : "border-muted-foreground/30"
        }`}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
      <span className="truncate">{children}</span>
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
  useEffect(() => setMounted(true), []);

  const communityMap = useMemo(() => {
    const map = new Map<string, Community>();
    for (const c of communities) {
      map.set(c.slug, c);
    }
    return map;
  }, [communities]);

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

    return result.sort((a, b) =>
      compareAsc(new Date(a.startAt), new Date(b.startAt)),
    );
  }, [events, search, selectedCommunities, selectedFormats, dateRange]);

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
    dateRange !== "all";

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
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Search + Filters */}
      <div className="flex flex-col gap-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <FilterDropdown
          label="Community"
          icon={Users}
          selectedCount={selectedCommunities.size}
        >
          {communities.map((c) => (
            <DropdownItem
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
            </DropdownItem>
          ))}
        </FilterDropdown>

        <FilterDropdown
          label="Event Type"
          icon={Tag}
          selectedCount={selectedFormats.size}
        >
          {FORMAT_OPTIONS.map((f) => (
            <DropdownItem
              key={f}
              selected={selectedFormats.has(f)}
              onClick={() => toggleSet(setSelectedFormats, f)}
            >
              {f}
            </DropdownItem>
          ))}
        </FilterDropdown>

        <FilterDropdown
          label={
            DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label ??
            "Date"
          }
          icon={CalendarDays}
          selectedCount={dateRange !== "all" ? 1 : 0}
        >
          {DATE_RANGE_OPTIONS.map((opt) => (
            <DropdownItem
              key={opt.value}
              selected={dateRange === opt.value}
              onClick={() => setDateRange(opt.value)}
            >
              {opt.label}
            </DropdownItem>
          ))}
        </FilterDropdown>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 shrink-0 text-xs text-muted-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
        </div>
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
