# Nixx AI

A personal Indonesian-language AI chat assistant with real-time streaming responses, conversation history, and a dark-mode-first interface.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/nixx-ai run dev` — run the frontend (port 18605)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI Integrations (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, Framer Motion, Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI via Replit AI Integrations (`gpt-5.4`, streaming SSE)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB schema (conversations + messages tables)
- `artifacts/api-server/src/routes/openai/` — AI chat backend routes
- `artifacts/nixx-ai/src/` — React frontend
- `lib/integrations-openai-ai-server/` — OpenAI SDK client wrapper

## Architecture decisions

- SSE streaming: the chat endpoint (`POST /api/openai/conversations/:id/messages`) returns a `text/event-stream` response. The frontend consumes it with raw `fetch` + `ReadableStream` — Orval-generated hooks are not used for this endpoint since Orval can't type SSE streams.
- All conversation and message history is persisted to Postgres. System prompt is injected server-side on every request.
- Dark mode is default and only mode — no light mode toggle needed.
- Conversations are created explicitly via `POST /api/openai/conversations` before any messages can be sent.

## Product

- Start a new conversation with "Percakapan Baru"
- Chat with Nixx AI in Indonesian — responses stream in real time character by character
- All conversations saved and accessible in the sidebar
- Delete conversations from the sidebar

## User preferences

- Language: Indonesian (UI and AI responses)
- AI persona: Nixx AI — casual, natural, no LaTeX, no meta-talk

## Gotchas

- SSE streaming endpoint: do NOT use the generated `useSendOpenaiMessage` hook for the chat flow — use raw `fetch` with `ReadableStream` parsing
- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before touching generated types

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `ai-integrations-openai` skill for AI integration details
