import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import userRouter from "./user";
import adminRouter from "./admin";
import paymentRouter from "./payment";

const router: IRouter = Router();

router.use(healthRouter);
router.use(openaiRouter);
router.use(userRouter);
router.use(adminRouter);
router.use(paymentRouter);

export default router;
