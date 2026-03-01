"use client";

import {
  ScrollVelocityRow,
} from "@/components/ui/scroll-based-velocity";
import { EventSearchDialog } from "@/components/command-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Event } from "@/server/db/schema/events";

interface HeaderProps {
  communityNames: string[];
  events: Event[];
}

export function Header({ communityNames, events }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">AI Calendar</h1>
            <p className="mt-0.5 text-sm text-muted-foreground sm:mt-1 sm:text-base">
              Portland AI Community Events
            </p>
          </div>
          <div className="flex items-center gap-2">
            <EventSearchDialog events={events} />
            <ThemeToggle />
          </div>
        </div>
      </div>
      {communityNames.length > 0 && (
        <div className="border-t bg-muted/30 py-2 overflow-hidden">
          <ScrollVelocityRow baseVelocity={3} direction={-1} className="text-sm text-muted-foreground">
            {communityNames.map((name) => (
              <span key={name} className="mx-4 inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
                {name}
              </span>
            ))}
          </ScrollVelocityRow>
        </div>
      )}
    </header>
  );
}
