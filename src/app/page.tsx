import { db } from "@/server/db";
import { events } from "@/server/db/schema/events";
import { communities } from "@/server/db/schema/communities";
import { gte, eq, asc } from "drizzle-orm";
import { Header } from "@/components/header";
import { EventList } from "@/components/event-list";

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

  return (
    <div className="min-h-screen">
      <Header communityCount={allCommunities.length} />
      <div className="container max-w-4xl py-8">
        <EventList events={approvedEvents} communities={allCommunities} />
      </div>
    </div>
  );
}
