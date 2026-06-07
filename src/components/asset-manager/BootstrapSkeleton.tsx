import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BootstrapSkeleton() {
  return (
    <div aria-label="Memuat TvLink" className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-3 border-b border-tvlink-app-border pb-4">
        <Skeleton className="size-11 rounded-tvlink-card" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="size-10 rounded-full" />
      </div>
      <Card
        className="gap-0 rounded-tvlink-card border border-tvlink-app-border bg-tvlink-card-bg shadow-tvlink-soft"
        size="sm"
      >
        <CardHeader className="border-b border-tvlink-app-border pb-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-full max-w-[18rem]" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-[5.5rem] w-full rounded-tvlink-card" />
          <Skeleton className="h-[5.5rem] w-full rounded-tvlink-card" />
          <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
            <Skeleton className="h-10 w-full rounded-tvlink-button" />
            <Skeleton className="h-10 w-full rounded-tvlink-button" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
