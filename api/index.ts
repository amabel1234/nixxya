// Vercel serverless entry point — imports the esbuild bundle created at build time
import type { Request, Response } from "express";

let app: ((req: Request, res: Response) => void) | undefined;
let initError: unknown;

async function initApp() {
  if (app || initError) return;
  try {
    const mod = await import("./bundle.mjs");
    app = mod.default as (req: Request, res: Response) => void;
  } catch (err) {
    initError = err;
  }
}

export default async function handler(req: Request, res: Response) {
  await initApp();
  if (initError) {
    const err = initError as Error;
    res.status(500).json({
      error: err?.message ?? String(initError),
      type: err?.constructor?.name ?? typeof initError,
      stack: err?.stack?.split("\n").slice(0, 6),
    });
    return;
  }
  app!(req, res);
}
