// Vercel serverless handler — imports pre-compiled Express app
// Built by: pnpm --filter @workspace/api-server run build
import app from "../artifacts/api-server/dist/app-vercel.mjs";

export default app;
