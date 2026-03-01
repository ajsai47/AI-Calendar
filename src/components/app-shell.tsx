"use client";

import { useState } from "react";
import {
  MessageSquare,
  Map,
  CalendarDays,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
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

type MobileTab = "events" | "chat" | "map";

export function AppShell({ events, communities }: AppShellProps) {
  const [chatOpen, setChatOpen] = useState(true);
  const [mapOpen, setMapOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("events");

  return (
    <>
      {/* ── Desktop layout (lg+) ─────────────────────────────────────── */}
      <div className="hidden min-h-0 flex-1 lg:flex">
        {/* Left — Chat Panel */}
        {chatOpen ? (
          <aside className="flex w-80 shrink-0 flex-col border-r">
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
          <div className="shrink-0 border-r">
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
          <aside className="flex w-96 shrink-0 flex-col border-l">
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
          <div className="shrink-0 border-l">
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

      {/* ── Mobile layout (<lg) ──────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        {/* Active panel */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {mobileTab === "events" && (
            <main className="h-full overflow-y-auto">
              <div className="px-4 py-4">
                <EventList events={events} communities={communities} />
              </div>
            </main>
          )}

          {mobileTab === "chat" && (
            <div className="flex h-full flex-col">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Event Assistant</h2>
                <p className="text-xs text-muted-foreground">
                  Ask about Portland AI events
                </p>
              </div>
              <ChatPanel hideHeader />
            </div>
          )}

          {mobileTab === "map" && (
            <div className="h-full">
              <EventMapWrapper events={events} />
            </div>
          )}
        </div>

        {/* Bottom tab bar */}
        <nav className="shrink-0 border-t bg-background">
          <div className="flex">
            {([
              { key: "events", label: "Events", icon: CalendarDays },
              { key: "chat", label: "Chat", icon: MessageSquare },
              { key: "map", label: "Map", icon: Map },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMobileTab(key)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                  mobileTab === key
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${mobileTab === key ? "stroke-[2.5]" : ""}`} />
                <span className={mobileTab === key ? "font-medium" : ""}>{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
