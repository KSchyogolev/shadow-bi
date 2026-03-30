# Shadow BI

Analytics dashboard for Jira Cloud. Syncs issues, sprints, and team data from Jira, then surfaces metrics like cycle time, throughput, sprint burndown, and workload distribution.

## Stack

| Layer | Tech |
|-------|------|
| Runtime | Bun |
| Backend | Elysia, Drizzle ORM, PostgreSQL |
| Frontend | React 19, Vite, Tailwind CSS 4, Visx |
| Shared | Zod schemas (API contract) |

## Structure

```
apps/api/        — Elysia backend (DDD-lite)
apps/web/        — React frontend (Feature-Sliced Design)
packages/shared/ — Zod schemas & shared types
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.1
- Docker (for PostgreSQL)
- Jira Cloud API token ([create one here](https://id.atlassian.com/manage-profile/security/api-tokens))

### Setup

```bash
# install dependencies
bun install

# start PostgreSQL
docker compose up -d

# configure environment
cp apps/api/.env.example apps/api/.env
# edit apps/api/.env with your Jira credentials

# run database migrations
bun run --filter @jira-board/api db:migrate

# start dev servers
bun run dev:api   # API on http://localhost:3001
bun run dev:web   # Web on http://localhost:5173
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `JIRA_HOST` | Jira Cloud URL (`https://your-org.atlassian.net`) |
| `JIRA_EMAIL` | Atlassian account email |
| `JIRA_API_TOKEN` | Jira API token |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | API server port (default `3001`) |

## Features

- **Dashboard** — high-level project health at a glance
- **Issues** — filterable issue list with detail view
- **Sprints** — sprint stats and burndown
- **Team** — per-member workload and contribution metrics
- **Flow Metrics** — cycle time, lead time, throughput
- **AI Agent** — natural-language queries over your project data
- **Jira Sync** — incremental data sync from Jira Cloud

## Scripts

```bash
bun run dev:api        # start API in watch mode
bun run dev:web        # start frontend dev server
bun run build          # build all packages
bun run typecheck      # type-check entire monorepo
bun run lint           # lint with ESLint
bun run format         # format with Prettier
```

## License

Private.
