import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  communityCount: number;
}

export function Header({ communityCount }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="container max-w-4xl py-8">
        <h1 className="text-2xl font-bold tracking-tight">AI Calendar</h1>
        <div className="mt-1 flex items-center gap-3">
          <p className="text-muted-foreground">
            Portland AI Community Events
          </p>
          {communityCount > 0 && (
            <Badge variant="secondary" className="font-normal">
              {communityCount} {communityCount === 1 ? "community" : "communities"}
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
