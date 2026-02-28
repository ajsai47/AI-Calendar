import { db } from "@/server/db";
import { events } from "@/server/db/schema/events";
import { communities } from "@/server/db/schema/communities";
import { gte, asc } from "drizzle-orm";
import { Header } from "@/components/header";
import { EventList } from "@/components/event-list";
import { SignupFeed } from "@/components/signup-feed";

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
    <div className="min-h-screen">
      <Header
        communityCount={allCommunities.length}
        communityNames={communityNames}
        events={approvedEvents}
      />
      <div className="container max-w-5xl py-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <div className="min-w-0 flex-1">
            <EventList events={approvedEvents} communities={allCommunities} />
          </div>
          <aside className="w-full shrink-0 lg:w-72">
            <SignupFeed />
          </aside>
        </div>
      </div>
    </div>
  );
}
