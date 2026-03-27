import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(val: string) {
    onValueChange(
      value.includes(val) ? value.filter((v) => v !== val) : [...value, val],
    );
  }

  function remove(val: string) {
    onValueChange(value.filter((v) => v !== val));
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Backspace" && !search && value.length > 0) {
      onValueChange(value.slice(0, -1));
    }
  }

  useEffect(() => {
    if (open) {
      setSearch("");
      inputRef.current?.focus();
    }
  }, [open]);

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v))
    .filter(Boolean);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-h-10 w-full items-center gap-1 rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm shadow-sm transition-colors",
            "focus-within:ring-2 focus-within:ring-ring/40 focus-within:border-ring",
            className,
          )}
        >
          <div className="flex flex-1 flex-wrap gap-1">
            {selectedLabels.map((opt) => (
              <span
                key={opt!.value}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {opt!.label}
                <X
                  className="size-3 cursor-pointer opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(opt!.value);
                  }}
                />
              </span>
            ))}
            {value.length === 0 && (
              <span className="text-muted-foreground py-0.5">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className={cn(
            "z-50 min-w-(--radix-popover-trigger-width) w-max max-w-80 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          <div className="border-b border-border px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search…"
              className="h-6 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-center text-sm text-muted-foreground">
                Nothing found.
              </div>
            )}
            {filtered.map((option) => {
              const selected = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className="relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 pl-7 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="absolute left-1.5 flex size-3.5 items-center justify-center">
                    {selected && <Check className="size-4" />}
                  </span>
                  {option.label}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
