import { cn } from "@/lib/utils";

interface CommunityBadgeProps {
  name: string;
  color?: string | null;
  className?: string;
}

export function CommunityBadge({ name, color, className }: CommunityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        className,
      )}
      style={
        color
          ? {
              backgroundColor: `${color}18`,
              color: color,
            }
          : undefined
      }
    >
      {name}
    </span>
  );
}
