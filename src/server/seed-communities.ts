import { db } from "@/server/db";
import { communities } from "@/server/db/schema";
import type { CommunityInsert } from "@/server/db/schema/communities";

const PORTLAND_COMMUNITIES: CommunityInsert[] = [
  {
    slug: "ai-portland",
    name: "AI Portland",
    description: "Portland's AI community meetup group",
    meetupSlug: "ai-portland",
    color: "#3B82F6",
  },
  {
    slug: "pdxhacks",
    name: "PDXHacks",
    description: "Portland hackathon community",
    lumaCalendarSlug: "pdxhacks",
    color: "#8B5CF6",
  },
  {
    slug: "aic-portland",
    name: "AI Collective Portland",
    description: "GenAI Collective Portland chapter",
    lumaCalendarSlug: "genai-collective",
    color: "#F59E0B",
  },
  {
    slug: "portland-ai-engineers",
    name: "Portland AI Engineers",
    description: "Portland AI Engineers meetup group",
    meetupSlug: "portland-ai-engineers",
    color: "#10B981",
  },
  {
    slug: "ai-tinkerers-pdx",
    name: "AI Tinkerers Portland",
    description: "AI Tinkerers Portland chapter",
    meetupSlug: "ai-tinkerers-portland-or",
    color: "#EC4899",
  },
  {
    slug: "pdx-robotics",
    name: "PDX Robotics",
    description: "Portland robotics and AI hardware community",
    color: "#6366F1",
  },
];

async function seed() {
  console.log("Seeding communities...");

  await db
    .insert(communities)
    .values(PORTLAND_COMMUNITIES)
    .onConflictDoNothing({ target: communities.slug });

  console.log(`Seeded ${PORTLAND_COMMUNITIES.length} communities.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
