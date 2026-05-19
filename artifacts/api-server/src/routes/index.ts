import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import userRouter from "./user";

const router: IRouter = Router();

router.use(healthRouter);
router.use(openaiRouter);
router.use(userRouter);

export default router;
