# Nixx AI

Asisten AI chat berbasis web dengan dukungan 26 model AI, antarmuka dalam Bahasa Indonesia.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + shadcn/ui (artifact: `nixx-ai`)
- API: Express 5 (artifact: `api-server`)
- DB: PostgreSQL + Drizzle ORM (`conversations`, `messages` tables)
- AI: Replit AI Integrations → OpenAI (`@workspace/integrations-openai-ai-server`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/nixx-ai/` — React + Vite frontend
- `artifacts/api-server/` — Express 5 backend
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/db/src/schema/` — Drizzle ORM schema (`conversations.ts`, `messages.ts`)
- `lib/integrations-openai-ai-server/` — OpenAI SDK client (Replit AI Integrations)
- `api/index.ts` — Vercel serverless entry point
- `vercel.json` — Vercel deployment config

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas
- SSE streaming for chat responses (disabled on Vercel due to SSE limitations)
- Dual AI key support: `AI_INTEGRATIONS_OPENAI_BASE_URL`+`AI_INTEGRATIONS_OPENAI_API_KEY` (Replit) OR `OPENAI_API_KEY` (Vercel/other)
- All routes prefixed with `/api/` for proxy routing compatibility

## Product

- Chat UI dalam Bahasa Indonesia dengan 26 pilihan model AI
- Sidebar untuk manajemen percakapan (buat baru, pilih, hapus)
- Streaming respons AI real-time via Server-Sent Events
- Dark/light mode toggle
- Siap deploy ke Vercel

## User preferences

- Bahasa UI: Indonesia
- Target deployment: Vercel (menggunakan `vercel.json` + `api/index.ts`)

## Gotchas

- Vercel tidak support SSE; gunakan JSON response untuk produksi Vercel
- Selalu jalankan `pnpm --filter @workspace/api-spec run codegen` setelah mengubah `openapi.yaml`
- Selalu jalankan `pnpm --filter @workspace/db run push` setelah mengubah schema DB

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
