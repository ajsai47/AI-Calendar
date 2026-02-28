import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const formatColors: Record<string, string> = {
  Meetup: "bg-blue-50 text-blue-700 border-blue-200",
  Workshop: "bg-amber-50 text-amber-700 border-amber-200",
  Hackathon: "bg-purple-50 text-purple-700 border-purple-200",
  Summit: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Online: "bg-sky-50 text-sky-700 border-sky-200",
  Social: "bg-pink-50 text-pink-700 border-pink-200",
  Other: "bg-stone-50 text-stone-600 border-stone-200",
};

interface FormatBadgeProps {
  format: string;
  className?: string;
}

export function FormatBadge({ format, className }: FormatBadgeProps) {
  const colorClass = formatColors[format] ?? formatColors.Other;

  return (
    <Badge
      variant="outline"
      className={cn("font-normal", colorClass, className)}
    >
      {format}
    </Badge>
  );
}
