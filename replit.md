# Nixx AI

Platform chat AI full-stack dengan 26+ model AI, antarmuka bahasa Indonesia, tema purple/violet, dan autentikasi Clerk.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — jalankan API server (port 8080)
- `pnpm --filter @workspace/web run dev` — jalankan web frontend
- `pnpm run typecheck` — typecheck semua package
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks dari OpenAPI spec
- `pnpm --filter @workspace/db run push` — push schema DB (dev only)
- Required env: `DATABASE_URL`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifacts/web)
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (via Replit integration)
- AI: OpenAI via Replit AI Integrations proxy
- Validation: Zod (zod/v4), drizzle-zod

## Where things live

- `artifacts/web/src/pages/` — LandingPage, DashboardPage, not-found
- `artifacts/web/src/components/chat/` — ConversationSidebar, MessageList, ChatInput, WelcomeScreen
- `artifacts/web/src/lib/models.ts` — daftar 26 model AI dengan emoji & badge
- `artifacts/web/src/index.css` — tema warna purple/violet
- `artifacts/api-server/src/routes/openai/` — endpoint chat + SSE streaming
- `lib/db/src/schema/conversations.ts` — schema database percakapan

## Architecture decisions

- Model selector terintegrasi di sidebar (bukan dropdown terpisah di atas)
- SSE streaming untuk respons AI real-time
- Pre-built deploy ke Vercel (build di Replit, upload dist ke Vercel)
- GitHub: kode di-push ke branch `replit-main` (bukan `main`)
- Sidebar mobile: overlay/drawer, desktop: persistent sidebar

## Product

Nixx AI adalah platform chat AI berbahasa Indonesia dengan:
- 26+ model AI (GPT, Claude, Gemini, Grok, Llama, dll) dengan badge di sidebar
- Autentikasi Clerk (login/daftar/lupa password)
- Chat streaming real-time dengan markdown rendering
- Riwayat percakapan tersimpan per pengguna
- UI dark purple/violet, mobile-first

## User preferences

- Bahasa Indonesia di seluruh UI
- Tema warna: dark purple/violet (bukan navy/cyan)
- Model AI tampil di sidebar dengan emoji dan badge
- Mengikuti style screenshot referensi dari pengguna

## Gotchas

- git commit diblokir di main agent — gunakan project task untuk commit ke GitHub
- Vercel deploy: gunakan `vercel deploy --prebuilt --archive=tgz` dari root (build lokal dulu)
- Build Vercel dari remote gagal karena workspace packages — selalu prebuilt
- Port 8080 (API), 22333 (web dev)

## Pointers

- Lihat `pnpm-workspace` skill untuk struktur workspace dan TypeScript setup
