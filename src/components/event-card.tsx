import Image from "next/image";
import { format } from "date-fns";
import { MapPin, ExternalLink, Clock } from "lucide-react";
import { CommunityBadge } from "@/components/community-badge";
import { FormatBadge } from "@/components/format-badge";
import type { Event } from "@/server/db/schema/events";
import type { Community } from "@/server/db/schema/communities";

interface EventCardProps {
  event: Event;
  community?: Community | null;
}

export function EventCard({ event, community }: EventCardProps) {
  const startDate = new Date(event.startAt);
  const endDate = event.endAt ? new Date(event.endAt) : null;

  const timeString = endDate
    ? `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`
    : format(startDate, "h:mm a");

  const location = event.venue || event.formattedAddress || event.city;

  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <article className="flex gap-4 py-4 sm:gap-6">
        {/* Image */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-32 sm:w-40">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 640px) 96px, 160px"
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

          {/* Time */}
          <p className="text-sm text-muted-foreground">
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
  );
}
