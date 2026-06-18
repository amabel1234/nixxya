export default async (req: any, res: any) => {
  try {
    // Dynamic import works from CJS context (can load CJS modules)
    // @ts-ignore
    const mod = await import("../artifacts/api-server/dist-vercel/app.js");
    const app = mod.default || mod;
    return app(req, res);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
      code: err.code,
      stack: (err.stack || "").slice(0, 800),
    });
  }
};
