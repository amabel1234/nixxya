# Nixx AI

Aplikasi chat AI berbahasa Indonesia dengan 26 pilihan model AI, gratis tanpa batas.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — jalankan API server (port 8080)
- `pnpm --filter @workspace/nixx-ai run dev` — jalankan frontend (port 18605)
- `pnpm run typecheck` — typecheck seluruh package
- `pnpm run build` — typecheck + build semua package
- `pnpm --filter @workspace/api-spec run codegen` — regenerasi API hooks dan Zod schema dari OpenAPI spec
- `pnpm --filter @workspace/db run push` — push perubahan schema DB (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validasi: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (dari OpenAPI spec)
- Build: esbuild (CJS bundle)
- AI: Mendukung Replit AI Integrations, OpenAI, GitHub Models, dan fallback ke Pollinations.ai

## Where things live

- `lib/api-spec/openapi.yaml` — sumber kebenaran kontrak API
- `lib/db/src/schema/` — schema database (conversations, messages)
- `artifacts/api-server/src/routes/openai/` — route API chat AI
- `artifacts/nixx-ai/src/pages/chat.tsx` — halaman chat utama
- `artifacts/nixx-ai/src/components/chat-sidebar.tsx` — sidebar percakapan & model selector
- `artifacts/nixx-ai/src/components/chat-thread.tsx` — thread chat dengan streaming
- `lib/integrations-openai-ai-server/` — client OpenAI dengan fallback otomatis

## Architecture decisions

- AI client menggunakan prioritas: Replit AI Integrations → OpenAI key → GitHub Models → Pollinations.ai (gratis, tanpa key)
- Server streaming (SSE) digunakan jika key tersedia, fallback ke frontend streaming via Pollinations
- Percakapan disimpan di PostgreSQL; pesan AI juga disimpan setelah streaming selesai
- Dark/light mode menggunakan `data-theme` attribute pada `<html>`, disimpan di localStorage
- 26 model AI dikonfigurasi di frontend; persona unik per model dikirim sebagai system prompt

## Product

- Chat AI berbahasa Indonesia dengan 26 model pilihan (GPT-4o, Llama, Gemini, Grok, dll.)
- Riwayat percakapan tersimpan permanen di database
- Mode gelap/terang dapat diubah kapan saja
- Streaming respons real-time untuk pengalaman chat yang cepat
- Gratis tanpa perlu daftar akun

## User preferences

- Komunikasi dalam Bahasa Indonesia

## Gotchas

- Selalu jalankan codegen setelah mengubah `openapi.yaml`
- Jika tidak ada AI key, app otomatis fallback ke Pollinations.ai (lebih lambat tapi tetap berfungsi)
- `GITHUB_TOKEN` bisa diset sebagai env var untuk menggunakan GitHub Models (gratis, lebih cepat dari Pollinations)

## Pointers

- Lihat skill `pnpm-workspace` untuk struktur workspace, setup TypeScript, dan detail package
