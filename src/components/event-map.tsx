"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { icon } from "leaflet";
import { format } from "date-fns";
import type { Event } from "@/server/db/schema/events";

import "leaflet/dist/leaflet.css";

// Fix default marker icon (Leaflet CSS path issue with bundlers)
const defaultIcon = icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const TILE_URLS = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

interface EventMapProps {
  events: Event[];
}

// Portland center coordinates
const PDX_CENTER: [number, number] = [45.5152, -122.6784];

export function EventMap({ events }: EventMapProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // react-leaflet requires client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  const mappableEvents = events.filter(
    (e) => e.latitude != null && e.longitude != null,
  );

  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Loading map...
      </div>
    );
  }

  return (
    <div className={`h-full w-full overflow-hidden rounded-lg border ${isDark ? "leaflet-dark" : ""}`}>
      <MapContainer
        center={PDX_CENTER}
        zoom={11}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={isDark ? TILE_URLS.dark : TILE_URLS.light}
        />
        {mappableEvents.map((event) => (
          <Marker
            key={event.platformId}
            position={[event.latitude!, event.longitude!]}
            icon={defaultIcon}
          >
            <Popup>
              <div className="min-w-[180px] space-y-1">
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold leading-tight hover:underline"
                >
                  {event.title}
                </a>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.startAt), "EEE, MMM d · h:mm a")}
                </p>
                {(event.venue || event.formattedAddress) && (
                  <p className="text-xs text-muted-foreground">
                    {event.venue || event.formattedAddress}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
