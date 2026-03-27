import { cn } from "@/shared/lib/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of{" "}
        {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className={cn(
            "rounded-lg border border-border px-3 py-1.5 text-sm transition-colors",
            page <= 1
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-secondary/50",
          )}
        >
          Previous
        </button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className={cn(
            "rounded-lg border border-border px-3 py-1.5 text-sm transition-colors",
            page >= totalPages
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-secondary/50",
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}
