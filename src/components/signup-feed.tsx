"use client";

import { cn } from "@/lib/utils";
import { AnimatedList } from "@/components/ui/animated-list";

interface SignupNotification {
  name: string;
  community: string;
  color: string;
  time: string;
}

const SAMPLE_SIGNUPS: SignupNotification[] = [
  { name: "Sarah K.", community: "AI Portland", color: "#3B82F6", time: "just now" },
  { name: "Marcus T.", community: "AI Tinkerers", color: "#EC4899", time: "2m ago" },
  { name: "Priya R.", community: "PDXHacks", color: "#8B5CF6", time: "3m ago" },
  { name: "Jordan L.", community: "AI Engineers", color: "#10B981", time: "5m ago" },
  { name: "Alex W.", community: "AI Collective", color: "#F59E0B", time: "8m ago" },
  { name: "Dana M.", community: "AI Portland", color: "#3B82F6", time: "10m ago" },
  { name: "Chris P.", community: "PDXHacks", color: "#8B5CF6", time: "12m ago" },
  { name: "Riley S.", community: "AI Tinkerers", color: "#EC4899", time: "15m ago" },
  { name: "Taylor B.", community: "AI Engineers", color: "#10B981", time: "18m ago" },
  { name: "Jamie H.", community: "AI Collective", color: "#F59E0B", time: "20m ago" },
];

function SignupItem({ name, community, color, time }: SignupNotification) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 shadow-sm">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          joined {community}
        </p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
    </div>
  );
}

interface SignupFeedProps {
  className?: string;
}

export function SignupFeed({ className }: SignupFeedProps) {
  return (
    <div className={cn("w-full", className)}>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Live Signups
      </h3>
      <div className="relative max-h-[400px] overflow-hidden">
        <AnimatedList delay={2000}>
          {SAMPLE_SIGNUPS.map((signup, idx) => (
            <SignupItem key={idx} {...signup} />
          ))}
        </AnimatedList>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </div>
    </div>
  );
}
