"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar, MapPin, ExternalLink, Search } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FormatBadge } from "@/components/format-badge";
import type { Event } from "@/server/db/schema/events";

interface EventSearchDialogProps {
  events: Event[];
}

export function EventSearchDialog({ events }: EventSearchDialogProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Group events by week
  const thisWeekEvents: Event[] = [];
  const laterEvents: Event[] = [];
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  for (const event of events) {
    const d = new Date(event.startAt);
    if (d <= weekEnd) {
      thisWeekEvents.push(event);
    } else {
      laterEvents.push(event);
    }
  }

  return (
    <>
      {/* Trigger button in the header */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search events...</span>
        <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search events by name, location, format..." />
        <CommandList>
          <CommandEmpty>No events found.</CommandEmpty>

          {thisWeekEvents.length > 0 && (
            <CommandGroup heading="This Week">
              {thisWeekEvents.map((event) => (
                <EventCommandItem
                  key={event.platformId}
                  event={event}
                  onSelect={() => {
                    setOpen(false);
                    window.open(event.url, "_blank", "noopener,noreferrer");
                  }}
                />
              ))}
            </CommandGroup>
          )}

          {laterEvents.length > 0 && (
            <CommandGroup heading="Upcoming">
              {laterEvents.map((event) => (
                <EventCommandItem
                  key={event.platformId}
                  event={event}
                  onSelect={() => {
                    setOpen(false);
                    window.open(event.url, "_blank", "noopener,noreferrer");
                  }}
                />
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

function EventCommandItem({
  event,
  onSelect,
}: {
  event: Event;
  onSelect: () => void;
}) {
  const startDate = new Date(event.startAt);
  const location = event.venue || event.city;

  return (
    <CommandItem
      value={`${event.title} ${event.venue ?? ""} ${event.city ?? ""} ${event.format ?? ""}`}
      onSelect={onSelect}
      className="flex items-center gap-3 py-2.5"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
        <div className="text-center leading-tight">
          <div className="text-[10px] uppercase text-muted-foreground">
            {format(startDate, "MMM")}
          </div>
          <div className="text-sm">{format(startDate, "d")}</div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{event.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(startDate, "EEE, h:mm a")}
          </span>
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{location}</span>
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {event.format && <FormatBadge format={event.format} />}
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </CommandItem>
  );
}
