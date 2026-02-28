import { db } from "@/server/db";
import { events } from "@/server/db/schema/events";
import { communities } from "@/server/db/schema/communities";
import { gte, asc } from "drizzle-orm";
import { Header } from "@/components/header";
import { EventList } from "@/components/event-list";
import { ChatPanel } from "@/components/chat-panel";
import { EventMapWrapper } from "@/components/event-map-wrapper";

export const dynamic = "force-dynamic";
export const revalidate = 300; // revalidate every 5 minutes

export default async function HomePage() {
  const now = new Date();

  const [upcomingEvents, allCommunities] = await Promise.all([
    db
      .select()
      .from(events)
      .where(gte(events.startAt, now))
      .orderBy(asc(events.startAt)),
    db.select().from(communities),
  ]);

  // Only show approved events
  const approvedEvents = upcomingEvents.filter((e) => e.status === "approved");

  const communityNames = allCommunities.map((c) => c.name);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header
        communityCount={allCommunities.length}
        communityNames={communityNames}
        events={approvedEvents}
      />

      {/* Three-column layout: Chat | Calendar | Map */}
      <div className="flex min-h-0 flex-1">
        {/* Left — Chat Panel */}
        <aside className="hidden w-80 shrink-0 border-r lg:flex lg:flex-col">
          <ChatPanel />
        </aside>

        {/* Center — Event Calendar */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-6">
            <EventList events={approvedEvents} communities={allCommunities} />
          </div>
        </main>

        {/* Right — Map View */}
        <aside className="hidden w-96 shrink-0 border-l lg:block">
          <EventMapWrapper events={approvedEvents} />
        </aside>
      </div>
    </div>
  );
}
