"use client";

import dynamic from "next/dynamic";
import type { Event } from "@/server/db/schema/events";

const EventMap = dynamic(
  () => import("@/components/event-map").then((m) => m.EventMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Loading map...
      </div>
    ),
  },
);

interface EventMapWrapperProps {
  events: Event[];
}

export function EventMapWrapper({ events }: EventMapWrapperProps) {
  return <EventMap events={events} />;
}
