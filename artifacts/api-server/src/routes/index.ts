import { Router } from "express";
import healthRouter from "./health.js";
import openaiRouter from "./openai/index.js";

const router = Router();

router.use(healthRouter);
router.use(openaiRouter);

export default router;
