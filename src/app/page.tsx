import { db } from "@/server/db";
import { events } from "@/server/db/schema/events";
import { communities } from "@/server/db/schema/communities";
import { gte, asc } from "drizzle-orm";
import { Header } from "@/components/header";
import { AppShell } from "@/components/app-shell";

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
        communityNames={communityNames}
        events={approvedEvents}
      />

      <AppShell events={approvedEvents} communities={allCommunities} />
    </div>
  );
}
