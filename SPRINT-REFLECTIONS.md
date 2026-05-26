# Handler — Sprint Reflections

## Wave 1 (2026-05-26)
- Monorepo scaffold, auth, shell UI, Docker, Prisma schema
- 13 CodeRabbit issues fixed (types/express mismatch, port binding, healthcheck endpoint, auth hardcoding)

## Wave 2 (2026-05-26)
- SSE real-time event stream wired (GET /api/events, EventEmitter2 + RxJS)
- Tasks REST module: full CRUD at /api/tasks (GET list, GET :id, POST, PATCH, DELETE soft-dismiss)
- AgentJobs REST module: CRUD at /api/agent-jobs with status lifecycle timestamps
- Frontend Zustand stores: tasks.ts + agentJobs.ts
- useEventStream hook: SSE client, auto-reconnects on error
- ShellProvider: SSE + initial data load wired once at shell level
- TaskInbox: live task cards with DELEGATE, DISMISS, DRAFT (placeholder) + NEEDS ME filter
- AgentQueue: live job cards with pulsing status dots, 30s auto-collapse on completion
- Prisma initial migration file created (SQL only, deploy on VPS with DATABASE_URL)
- Seed service: inserts Telegram + GitHub default channels on first boot
- next.config.ts: /api/* rewrite to NestJS API (API_URL env var)
- Schema alignment note: spec field names differed from actual Prisma schema; Wave 2 aligns with live schema

## Wave 2.5 (2026-05-26)
- Schema aligned to spec: Task/AgentJob/Channel field names corrected, missing models added (AgentJobLog, Workflow, WorkflowRun, DecisionLog)
- Init migration regenerated to match correct schema (DB not yet deployed, so safe full replacement)
- All Wave 2 services, DTOs, and frontend types updated to match new field names

## Wave 3 (2026-05-26)
- PA module: Missive poller (60s), Telegram poller (30s via tracker inbox), GitHub webhook receiver
- PA classifier: Haiku-based intake classifier, auto-dispatch or lane routing
- Agent runner: streaming Anthropic SDK, max 2 concurrent, AgentJobLog append, SSE updates
- Fleet bind mounts added to docker-compose for Wave 4 fleet panel
