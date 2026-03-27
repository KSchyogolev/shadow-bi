import {
  ROLES,
  roleColor,
  roleLabel,
  useMembers,
  useUpdateMemberRole,
} from "@/entities/member";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
} from "@/shared/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { MemberRole, ProjectMember } from "@jira-board/shared";
import { memo, useCallback, useMemo } from "react";
import { Users } from "lucide-react";

interface MemberRowViewProps {
  member: ProjectMember;
  onRoleChange?: (id: number, role: MemberRole) => void;
}

const MemberRowView = memo(function MemberRowView({
  member,
  onRoleChange,
}: MemberRowViewProps) {
  return (
    <div className="grid grid-cols-[1fr_140px] items-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-2.5 hover:border-border">
      <span className="text-sm font-medium text-foreground truncate">
        {member.displayName}
      </span>

      <Select
        value={member.role}
        onValueChange={(value: MemberRole) => onRoleChange?.(member.id, value)}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((role) => (
            <SelectItem key={role} value={role}>
              <span className="flex items-center gap-2">
                <span
                  className={`size-3 rounded-sm shrink-0 ${roleColor(role)}`}
                />
                {roleLabel(role)}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

interface TeamMappingCardProps {
  projectKey: string;
}

export function TeamMappingCard({ projectKey }: TeamMappingCardProps) {
  const { data: members, isLoading } = useMembers(projectKey);
  const updateRoleMutation = useUpdateMemberRole();

  const handleRoleChange = useCallback(
    (id: number, role: MemberRole) => {
      updateRoleMutation.mutate({ id, role });
    },
    [updateRoleMutation.mutate],
  );

  const stats = useMemo(() => {
    if (!members) return null;
    const devCount = members.filter((m) => m.role === "DEV").length;
    const qaCount = members.filter((m) => m.role === "QA").length;
    const unassigned = members.filter((m) => m.role === "-").length;
    return { devCount, qaCount, unassigned };
  }, [members]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5" />
          Team Configuration
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Assign a role to each team member. Only DEV and QA members are
          included in project metrics.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : members && members.length > 0 ? (
          <div className="space-y-4">
            {stats && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>
                  <span className="inline-block size-2 rounded-sm bg-blue-500 mr-1" />
                  DEV: {stats.devCount}
                </span>
                <span>
                  <span className="inline-block size-2 rounded-sm bg-emerald-500 mr-1" />
                  QA: {stats.qaCount}
                </span>
                <span>
                  <span className="inline-block size-2 rounded-sm bg-zinc-400 mr-1" />
                  Unassigned: {stats.unassigned}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_140px] gap-3 px-1 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span>Member</span>
                <span>Role</span>
              </div>

              <div className="space-y-2">
                {members.map((member) => (
                  <MemberRowView
                    key={member.id}
                    member={member}
                    onRoleChange={handleRoleChange}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No team members found. Sync the project first.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
