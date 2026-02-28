import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const communities = pgTable("communities", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  websiteUrl: text("website_url"),
  logoUrl: text("logo_url"),
  color: text("color"), // hex color for UI badges

  // Platform links for scraping
  meetupSlug: text("meetup_slug"), // e.g. "ai-portland"
  lumaCalendarSlug: text("luma_calendar_slug"), // e.g. "genai-collective"
  eventbriteOrgId: text("eventbrite_org_id"),

  // Contact
  leaderName: text("leader_name"),
  leaderEmail: text("leader_email"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Community = typeof communities.$inferSelect;
export type CommunityInsert = typeof communities.$inferInsert;
