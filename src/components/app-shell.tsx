"use client";

import { useState } from "react";
import { MessageSquare, Map, PanelLeftClose, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/chat-panel";
import { EventList } from "@/components/event-list";
import { EventMapWrapper } from "@/components/event-map-wrapper";
import type { Event } from "@/server/db/schema/events";
import type { Community } from "@/server/db/schema/communities";

interface AppShellProps {
  events: Event[];
  communities: Community[];
}

export function AppShell({ events, communities }: AppShellProps) {
  const [chatOpen, setChatOpen] = useState(true);
  const [mapOpen, setMapOpen] = useState(true);

  return (
    <div className="flex min-h-0 flex-1">
      {/* Left — Chat Panel */}
      {chatOpen ? (
        <aside className="hidden w-80 shrink-0 border-r lg:flex lg:flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Event Assistant</h2>
              <p className="text-xs text-muted-foreground">
                Ask about Portland AI events
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => setChatOpen(false)}
            >
              <PanelLeftClose className="h-4 w-4" />
              <span className="sr-only">Close chat</span>
            </Button>
          </div>
          <ChatPanel hideHeader />
        </aside>
      ) : (
        <div className="hidden shrink-0 border-r lg:block">
          <Button
            variant="ghost"
            size="icon"
            className="m-2 h-8 w-8 text-muted-foreground"
            onClick={() => setChatOpen(true)}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="sr-only">Open chat</span>
          </Button>
        </div>
      )}

      {/* Center — Event Calendar */}
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <EventList events={events} communities={communities} />
        </div>
      </main>

      {/* Right — Map View */}
      {mapOpen ? (
        <aside className="hidden w-96 shrink-0 border-l lg:flex lg:flex-col">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="text-sm font-semibold">Map</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => setMapOpen(false)}
            >
              <PanelRightClose className="h-4 w-4" />
              <span className="sr-only">Close map</span>
            </Button>
          </div>
          <div className="min-h-0 flex-1">
            <EventMapWrapper events={events} />
          </div>
        </aside>
      ) : (
        <div className="hidden shrink-0 border-l lg:block">
          <Button
            variant="ghost"
            size="icon"
            className="m-2 h-8 w-8 text-muted-foreground"
            onClick={() => setMapOpen(true)}
          >
            <Map className="h-4 w-4" />
            <span className="sr-only">Open map</span>
          </Button>
        </div>
      )}
    </div>
  );
}
