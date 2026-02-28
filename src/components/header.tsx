"use client";

import { Badge } from "@/components/ui/badge";
import {
  ScrollVelocityRow,
} from "@/components/ui/scroll-based-velocity";
import { EventSearchDialog } from "@/components/command-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Event } from "@/server/db/schema/events";

interface HeaderProps {
  communityCount: number;
  communityNames: string[];
  events: Event[];
}

export function Header({ communityCount, communityNames, events }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="container max-w-5xl py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Calendar</h1>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-muted-foreground">
                Portland AI Community Events
              </p>
              {communityCount > 0 && (
                <Badge variant="secondary" className="font-normal">
                  {communityCount} {communityCount === 1 ? "community" : "communities"}
                </Badge>
              )}
            </div>
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
