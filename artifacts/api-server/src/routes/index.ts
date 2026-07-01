import { Router } from "express";
import healthRouter from "./health.js";
import openaiRouter from "./openai/index.js";
import usersRouter from "./users/index.js";
import paymentsRouter from "./payments/index.js";
import adminRouter from "./admin/index.js";
import settingsRouter from "./settings/index.js";

const router = Router();

router.use(healthRouter);
router.use(openaiRouter);
router.use("/users", usersRouter);
router.use("/payments", paymentsRouter);
router.use("/admin", adminRouter);
router.use("/settings", settingsRouter);

export default router;
