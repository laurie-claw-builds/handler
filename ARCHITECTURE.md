# Handler — Architecture

Last updated: 2026-05-26
SHA: (fill with current HEAD sha after commit)

## Stack
- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Zustand
- Backend: NestJS 10 + Prisma 5 + PostgreSQL (Neon)
- Real-time: Server-Sent Events (SSE) via GET /api/events
- Auth: JWT httpOnly cookie + bcrypt, single-user
- Deployment: Docker Compose on Hostinger VPS, Caddy reverse proxy

## Key modules
- `apps/api/src/auth/` — JWT auth
- `apps/api/src/tasks/` — Task CRUD + SSE emit
- `apps/api/src/agent-jobs/` — AgentJob CRUD + SSE emit
- `apps/api/src/events/` — SSE endpoint
- `apps/api/src/pa/` — PA agent (Wave 3: channel pollers + classifier)
- `apps/api/src/seed/` — Bootstrap seed: default Telegram + GitHub channels
- `apps/web/src/stores/` — Zustand: tasks + agentJobs
- `apps/web/src/hooks/useEventStream.ts` — SSE client hook
- `apps/web/src/components/ShellProvider.tsx` — Client shell: SSE init + initial data load

## Data flow
Task arrives -> TasksService.create() -> EventEmitter2 fires 'task.created' -> EventsService pushes SSE -> Frontend Zustand store upserted -> UI re-renders.

## Schema notes
The Prisma schema uses the following field names (not the spec's alternate names):
- Task: `summary` (not `title`), `status` (not `state`), `source` (not `channelId`), `priority` (int 1-10, not `urgency`)
- AgentJob: `description` (not `brief`), `tokensUsed` (not split in/out), `status` enum QUEUED/ACTIVE/BLOCKED/COMPLETE/FAILED
- Channel: `type` (ChannelType enum), `label`, `config` (JSON)

## Non-obvious gotchas
- API port is 3001 (internal). Caddy proxies /api/* to handler-api:3001. Next.js rewrites /api/* to localhost:3001 in dev.
- EventEmitter2 is in-process. No Redis/pub-sub needed (single-user, single instance).
- Prisma migrations must be run on VPS with DATABASE_URL set before first start.
- `page.tsx` is a Server Component but wraps `<ShellProvider>` (a Client Component) for SSE + store init. Only TaskInbox + AgentQueue are interactive.
- Fleet bind mounts: /home/lochness2-agent/agents and /home/lochness2-agent/pbt-shared-specialists mounted read-only at /fleet/agents and /fleet/shared (Wave 4).
- Dismiss sets status=DONE + resolvedAt (soft delete), not a hard DELETE.
