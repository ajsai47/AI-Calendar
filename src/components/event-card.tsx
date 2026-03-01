"use client";

import Image from "next/image";
import { useState } from "react";
import { format } from "date-fns";
import { MapPin, ExternalLink, Clock, Calendar } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CommunityBadge } from "@/components/community-badge";
import { FormatBadge } from "@/components/format-badge";
import type { Event } from "@/server/db/schema/events";
import type { Community } from "@/server/db/schema/communities";

interface EventCardProps {
  event: Event;
  community?: Community | null;
}

export function EventCard({ event, community }: EventCardProps) {
  const [imgError, setImgError] = useState(false);
  const startDate = new Date(event.startAt);
  const endDate = event.endAt ? new Date(event.endAt) : null;

  const timeString = endDate
    ? `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`
    : format(startDate, "h:mm a");

  const location = event.venue || event.formattedAddress || event.city;

  // Truncated description for hover preview
  const previewDescription = event.description
    ? event.description.length > 200
      ? event.description.slice(0, 200).trimEnd() + "..."
      : event.description
    : null;

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          <article className="flex gap-4 py-4 sm:gap-6">
            {/* Image */}
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-32 sm:w-40">
              {event.imageUrl && !imgError ? (
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                  sizes="(max-width: 640px) 96px, 160px"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Clock className="h-8 w-8" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-1.5">
                {community && (
                  <CommunityBadge
                    name={community.name}
                    color={community.color}
                  />
                )}
                {event.format && <FormatBadge format={event.format} />}
              </div>

              {/* Title */}
              <h3 className="truncate text-base font-semibold leading-tight group-hover:underline sm:text-lg">
                {event.title}
              </h3>

              {/* Time — suppressHydrationWarning: server (UTC) and client (local TZ) may format differently */}
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {format(startDate, "EEE, MMM d")} &middot; {timeString}
              </p>

              {/* Location */}
              {location && (
                <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{location}</span>
                </p>
              )}
            </div>

            {/* External link icon */}
            <div className="hidden shrink-0 self-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:block">
              <ExternalLink className="h-4 w-4" />
            </div>
          </article>
        </a>
      </HoverCardTrigger>

      <HoverCardContent side="right" align="start" className="w-80">
        {/* Cover image in hover */}
        {event.imageUrl && (
          <div className="relative -mx-4 -mt-4 mb-3 h-36 overflow-hidden rounded-t-md">
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              sizes="320px"
            />
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-semibold leading-snug">{event.title}</h4>

          {/* Date & time */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              {format(startDate, "EEEE, MMMM d, yyyy")} &middot; {timeString}
            </span>
          </div>

          {/* Full location */}
          {(event.formattedAddress || location) && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{event.formattedAddress || location}</span>
            </div>
          )}

          {/* Description preview */}
          {previewDescription && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {previewDescription}
            </p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {community && (
              <CommunityBadge
                name={community.name}
                color={community.color}
              />
            )}
            {event.format && <FormatBadge format={event.format} />}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
