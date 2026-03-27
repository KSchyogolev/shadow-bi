interface InfoRowProps {
  label: string;
  children: React.ReactNode;
}

export function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0 w-40">
        {label}
      </span>
      <span className="text-sm text-foreground text-right">{children}</span>
    </div>
  );
}
