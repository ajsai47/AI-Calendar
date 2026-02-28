import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const eventPlatformEnum = pgEnum("event_platform", [
  "luma",
  "meetup",
  "eventbrite",
  "manual",
]);

export const eventFormatEnum = pgEnum("event_format", [
  "Meetup",
  "Workshop",
  "Hackathon",
  "Summit",
  "Online",
  "Social",
  "Other",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "approved",
  "pending_review",
  "hidden",
]);

export const events = pgTable(
  "events",
  {
    platformId: text("platform_id").primaryKey(),
    platform: eventPlatformEnum("platform").notNull(),
    communitySlug: text("community_slug"),

    // Core fields
    title: text("title").notNull(),
    description: text("description"),
    url: text("url").notNull(),
    imageUrl: text("image_url"),
    format: eventFormatEnum("format"),
    startAt: timestamp("start_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true, mode: "date" }),

    // Location
    venue: text("venue"),
    formattedAddress: text("formatted_address"),
    city: text("city"),
    country: text("country"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    timezone: text("timezone"),

    // Metadata
    status: eventStatusEnum("status").notNull().default("approved"),
    isFeatured: boolean("is_featured").notNull().default(false),
    platformData: jsonb("platform_data"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    startAtIndex: index("idx_events_start_at").on(table.startAt),
    platformIndex: index("idx_events_platform").on(table.platform),
    communityIndex: index("idx_events_community").on(table.communitySlug),
    statusIndex: index("idx_events_status").on(table.status),
  }),
);

export type Event = typeof events.$inferSelect;
export type EventInsert = typeof events.$inferInsert;
