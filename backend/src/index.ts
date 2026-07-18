import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import routes from "./routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import helmet from "helmet";
import sanitizeMiddleware from "./middlewares/sanitize.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import compression from "compression";
const app = express();
dotenv.config();

const allowedOrigins = [
  "https://www.avatarindia.com",
  "https://avatar-learning.vercel.app/",
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL?.replace(/\/$/, ""),
].filter(Boolean) as string[];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("Origin not allowed by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  }),
);
app.use(helmet());
app.use(compression());
app.use(
  express.json({
    verify: (req: any, _res: any, buf) => {
      (req as any).rawBody = buf.toString("utf8");
    },
  })
);
app.use(sanitizeMiddleware);

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
