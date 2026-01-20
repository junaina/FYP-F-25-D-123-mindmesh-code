"use client";
import { Button } from "@/components/ui/button";

export default function PaginationFooter({
  canLoadMore,
  isLoading,
  onLoadMore,
}: {
  canLoadMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div className="flex justify-center py-4">
      <Button
        variant="outline"
        onClick={onLoadMore}
        disabled={!canLoadMore || isLoading}
      >
        {isLoading ? "Loading…" : "Load more"}
      </Button>
    </div>
  );
}
