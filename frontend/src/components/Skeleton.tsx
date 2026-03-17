"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60",
        className
      )}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden h-full flex flex-col">
      <Skeleton className="aspect-square rounded-none" />
      <div className="p-4 flex-1 flex flex-col gap-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-auto pt-2 flex flex-col gap-1">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="relative w-full aspect-[16/9] md:aspect-[21/7] bg-muted overflow-hidden">
      <Skeleton className="w-full h-full rounded-none" />
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 gap-3">
        <Skeleton className="h-8 md:h-12 w-2/3" />
        <Skeleton className="h-4 md:h-6 w-1/2" />
      </div>
    </div>
  );
}
