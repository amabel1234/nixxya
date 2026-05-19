# Nixx AI

Aplikasi chat AI berbasis web dalam Bahasa Indonesia dengan 26 pilihan model AI, sistem login, riwayat percakapan, langganan premium, dan pembayaran via QRIS Dana.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — jalankan API server (port 8080)
- `pnpm --filter @workspace/nixx-ai run dev` — jalankan frontend (port 18605)
- `pnpm run typecheck` — full typecheck semua packages
- `pnpm run build` — typecheck + build semua packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks dan Zod schemas dari OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifact: nixx-ai, port 18605)
- API: Express 5 (artifact: api-server, port 8080)
- Auth: Clerk (Replit-managed)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (dari OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth untuk semua API contracts
- `lib/db/src/schema/` — semua Drizzle table definitions
- `lib/api-client-react/src/generated/` — generated React Query hooks (jangan edit manual)
- `lib/api-zod/src/generated/` — generated Zod validators (jangan edit manual)
- `artifacts/nixx-ai/src/pages/` — halaman: chat, landing, premium, profile, admin
- `artifacts/nixx-ai/src/components/` — komponen: chat-sidebar, chat-thread
- `artifacts/api-server/src/routes/` — Express route handlers

## Architecture decisions

- Contract-first API: OpenAPI spec → codegen → typed hooks + Zod validators
- Auth per user via Clerk; setiap conversation memiliki userId FK
- Daily limit tracking di tabel `message_usage` (20 pesan/hari untuk free tier)
- Manual QRIS payment flow: user submit konfirmasi → admin approve via `/admin` panel
- Streaming AI via SSE jika ada API key; fallback ke Pollinations API gratis tanpa key

## Product

- **Landing page**: showcase fitur, CTA sign up/sign in
- **Chat**: 26 model AI, sidebar riwayat percakapan, usage limit indicator
- **Premium**: pilih paket (Rp 15K/30K/120K), bayar QRIS Dana, submit konfirmasi
- **Profil**: info akun, status premium, sisa kuota harian
- **Admin panel** (`/admin`): kelola semua permintaan pembayaran, konfirmasi/tolak

## User preferences

- Bahasa Indonesia untuk semua teks UI
- Harga premium terjangkau: Bulanan Rp 15.000, 3 Bulan Rp 40.000, Tahunan Rp 120.000
- Payment via QRIS Dana
- Tema dark/light mode toggle

## Gotchas

- Setelah ubah OpenAPI spec, selalu jalankan codegen: `pnpm --filter @workspace/api-spec run codegen`
- Setelah ubah DB schema, jalankan: `pnpm --filter @workspace/db run push`
- Admin panel di `/admin` — set `ADMIN_USER_IDS` env var (comma-separated Clerk user IDs) untuk restrict access
- QRIS image: ganti URL di `artifacts/nixx-ai/src/pages/premium.tsx` dengan QRIS Dana yang sebenarnya

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
