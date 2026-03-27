import { DashboardPage } from "@/pages/dashboard";
import { IssuesPage } from "@/pages/issues";
import { IssueDetailPage } from "@/pages/issue-detail";
import { SettingsPage } from "@/pages/settings";
import { SprintsPage } from "@/pages/sprints";
import { TeamPage } from "@/pages/team";
import { AgentPage } from "@/pages/agent";
import { PageLayout } from "./layout";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

export function AppRouter() {
  return (
    <BrowserRouter>
      <PageLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/issues/:key" element={<IssueDetailPage />} />
          <Route path="/sprints" element={<SprintsPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/agent" element={<AgentPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </PageLayout>
    </BrowserRouter>
  );
}
