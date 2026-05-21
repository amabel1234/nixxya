import express from "express";
  import cors from "cors";
  import router from "./routes/index.js";

  const app = express();

  // Lazy-load pino only when NOT on Vercel
  if (!process.env["VERCEL"]) {
    const [pinoHttp, { logger }] = await Promise.all([
      import("pino-http").then(m => m.default),
      import("./lib/logger.js"),
    ]);
    app.use(
      pinoHttp({
        logger,
        serializers: {
          req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
          res(res) { return { statusCode: res.statusCode }; },
        },
      }),
    );
  }

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/api", router);

  export default app;
  