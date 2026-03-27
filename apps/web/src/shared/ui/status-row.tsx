import type { ReactNode } from "react";

type StatusVariant = "muted" | "loading" | "success" | "error";

const statusStyles: Record<StatusVariant, string> = {
  muted: "text-muted-foreground bg-secondary/60",
  loading: "text-primary bg-secondary/60",
  success: "text-success bg-success/5 border border-success/20",
  error: "text-destructive bg-destructive/5 border border-destructive/20",
};

interface StatusRowProps {
  icon: React.ComponentType<{ className?: string }>;
  variant: StatusVariant;
  children: ReactNode;
}

export function StatusRow({ icon: Icon, variant, children }: StatusRowProps) {
  return (
    <div
      className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${statusStyles[variant]}`}
    >
      <Icon
        className={`size-3.5 shrink-0 ${variant === "loading" ? "animate-spin" : ""}`}
      />
      <span>{children}</span>
    </div>
  );
}
