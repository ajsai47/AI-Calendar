import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const formatColors: Record<string, string> = {
  Meetup: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  Workshop: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  Hackathon: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
  Summit: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  Online: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
  Social: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800",
  Other: "bg-stone-50 text-stone-600 border-stone-200 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-700",
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
