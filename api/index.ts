import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import router from "../artifacts/api-server/src/routes/index";

const app = express();

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());
app.use("/api", router);

export default app;
