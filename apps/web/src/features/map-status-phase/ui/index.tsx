import {
  phaseColor,
  PHASES,
  useReorderStatuses,
  useStatuses,
  useUpdateStatusPhase,
  useUpdateStatusInCycle,
} from "@/entities/status";
import { api } from "@/shared/api";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
  StatusRow,
} from "@/shared/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { Phase, Status } from "@jira-board/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  GitBranchPlus,
  GripVertical,
  Loader2,
} from "lucide-react";
import { memo, useCallback, useMemo, useRef, useState } from "react";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  defaultAnimateLayoutChanges,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function useRecalculateMetrics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectKey: string) => api.sync.recalculate(projectKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

interface StatusRowViewProps {
  status: Status;
  onPhaseChange?: (id: number, phase: Phase) => void;
  onInCycleChange?: (id: number, inCycle: boolean) => void;
  isDragging?: boolean;
  isOverlay?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

const StatusRowView = memo(function StatusRowView({
  status,
  onPhaseChange,
  onInCycleChange,
  isDragging,
  isOverlay,
  dragHandleProps,
}: StatusRowViewProps) {
  return (
    <div
      className={`grid grid-cols-[24px_1fr_140px_100px] items-center gap-3 rounded-lg border bg-card px-3 py-2.5 ${
        isOverlay
          ? "shadow-xl border-primary/50 ring-1 ring-primary/20"
          : isDragging
            ? "opacity-40 border-border/30"
            : "border-border/50 hover:border-border"
      }`}
    >
      <div
        className="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
        {...dragHandleProps}
      >
        <GripVertical className="size-4" />
      </div>

      <span className="text-sm font-medium text-foreground">{status.name}</span>

      <Select
        value={status.phase}
        onValueChange={(value: Phase) => onPhaseChange?.(status.id, value)}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PHASES.map((phase) => (
            <SelectItem key={phase} value={phase}>
              <span className="flex items-center gap-2">
                <span
                  className={`size-3 rounded-sm shrink-0 ${phaseColor(phase)}`}
                />
                {phase}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex justify-center">
        <button
          type="button"
          role="switch"
          aria-checked={status.inCycle}
          onClick={() => onInCycleChange?.(status.id, !status.inCycle)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            status.inCycle ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
              status.inCycle ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
});

interface SortableStatusRowProps {
  status: Status;
  onPhaseChange: (id: number, phase: Phase) => void;
  onInCycleChange: (id: number, inCycle: boolean) => void;
}

const skipDropAnimation: AnimateLayoutChanges = (args) =>
  args.wasDragging ? false : defaultAnimateLayoutChanges(args);

const SortableStatusRow = memo(function SortableStatusRow({
  status,
  onPhaseChange,
  onInCycleChange,
}: SortableStatusRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id, animateLayoutChanges: skipDropAnimation });

  const style = useMemo(
    () => ({
      transform: CSS.Translate.toString(transform),
      transition,
    }),
    [transform, transition],
  );

  const dragHandleProps = useMemo(
    () => ({ ...attributes, ...listeners }),
    [attributes, listeners],
  );

  return (
    <div ref={setNodeRef} style={style}>
      <StatusRowView
        status={status}
        onPhaseChange={onPhaseChange}
        onInCycleChange={onInCycleChange}
        isDragging={isDragging}
        dragHandleProps={dragHandleProps}
      />
    </div>
  );
});

interface StatusPhaseMappingCardProps {
  projectKey: string;
}

export function StatusPhaseMappingCard({
  projectKey,
}: StatusPhaseMappingCardProps) {
  const { data: statuses, isLoading } = useStatuses(projectKey);
  const updatePhaseMutation = useUpdateStatusPhase();
  const updateInCycleMutation = useUpdateStatusInCycle();
  const reorderMutation = useReorderStatuses(projectKey);
  const recalcMutation = useRecalculateMetrics();

  const [activeId, setActiveId] = useState<number | null>(null);

  const activeStatus = useMemo(
    () => statuses?.find((s) => s.id === activeId) ?? null,
    [statuses, activeId],
  );

  const sortableIds = useMemo(
    () => statuses?.map((s) => s.id) ?? [],
    [statuses],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const modifiers = useMemo(
    () => [restrictToVerticalAxis, restrictToParentElement],
    [],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  }, []);

  const reorderRef = useRef(reorderMutation.mutate);
  reorderRef.current = reorderMutation.mutate;

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id || !statuses) return;

      const oldIndex = statuses.findIndex((s) => s.id === active.id);
      const newIndex = statuses.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(statuses, oldIndex, newIndex);
      reorderRef.current(reordered.map((s) => s.id));
    },
    [statuses],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handlePhaseChange = useCallback(
    (id: number, phase: Phase) => {
      updatePhaseMutation.mutate({ id, phase });
    },
    [updatePhaseMutation.mutate],
  );

  const handleInCycleChange = useCallback(
    (id: number, inCycle: boolean) => {
      updateInCycleMutation.mutate({ id, inCycle });
    },
    [updateInCycleMutation.mutate],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranchPlus className="size-5" />
          Status Phase Mapping
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Map each Jira workflow status to a flow phase for metrics calculation.
          Drag to reorder — this controls the chart display order.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : statuses && statuses.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="grid grid-cols-[24px_1fr_140px_100px] gap-3 px-1 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span />
                <span>Status</span>
                <span>Phase</span>
                <span className="text-center">IN CYCLE</span>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={modifiers}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <SortableContext
                  items={sortableIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {statuses.map((status) => (
                      <SortableStatusRow
                        key={status.id}
                        status={status}
                        onPhaseChange={handlePhaseChange}
                        onInCycleChange={handleInCycleChange}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay dropAnimation={null}>
                  {activeStatus ? (
                    <StatusRowView status={activeStatus} isOverlay />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                After changing phase mappings, recalculate metrics to apply
                changes to all issues.
              </p>
              <Button
                variant="secondary"
                onClick={() => recalcMutation.mutate(projectKey)}
                disabled={recalcMutation.isPending}
              >
                {recalcMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Calculator />
                )}
                {recalcMutation.isPending
                  ? "Recalculating…"
                  : "Recalculate Metrics"}
              </Button>

              {recalcMutation.isSuccess && (
                <StatusRow icon={CheckCircle2} variant="success">
                  Recalculated metrics for {recalcMutation.data.updated} issues
                </StatusRow>
              )}

              {recalcMutation.isError && (
                <StatusRow icon={AlertCircle} variant="error">
                  Recalculation failed. Check status mappings and try again.
                </StatusRow>
              )}
            </div>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No statuses found. Sync the project first.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
