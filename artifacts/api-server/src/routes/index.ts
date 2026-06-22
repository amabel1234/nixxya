import { Router } from "express";
import healthRouter from "./health.js";
import openaiRouter from "./openai/index.js";
import adminRouter from "./admin/index.js";
import paymentsRouter from "./payments/index.js";

const router = Router();

router.use(healthRouter);
router.use(openaiRouter);
router.use("/admin", adminRouter);
router.use("/payments", paymentsRouter);

export default router;
