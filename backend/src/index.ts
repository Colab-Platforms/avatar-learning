import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import routes from "./routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import helmet from "helmet";
import sanitizeMiddleware from "./middlewares/sanitize.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import compression from "compression";
import { startSessionCleanupJob } from "./jobs/sessionCleanup.job.js";
import { startAutomationWorker } from "./jobs/automation.job.js";
import { startPartnerCommissionJob } from "./jobs/partnerCommission.job.js";
import { requestContext } from "./modules/monitoring/request-context.js";
import { startMonitoringJob } from "./modules/monitoring/monitoring.job.js";
const app = express();
dotenv.config();

// Render sits in front of the app as its own proxy; without this every
// client IP collapses to Render's proxy IP and IP-based rate limiting
// would block all users together instead of individually.
app.set("trust proxy", 1);

const allowedOrigins = [
  "https://www.avatarindia.com",
  "https://avatar-learning.vercel.app/",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "https://avatar-test-theta.vercel.app",
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
      "X-Visitor-Id",
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
  }),
);
app.use(sanitizeMiddleware);
// Who is calling (IP, browser, visitor id), available to services without passing it around. Holds no body, password or token.
app.use(requestContext);

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Which database this process uses (host and name only, never credentials), so a wrong target is obvious at a glance.
  try {
    const u = new URL(process.env.DATABASE_URL ?? "");
    console.log(`Database: ${u.hostname}${u.port ? `:${u.port}` : ""}${u.pathname}`);
  } catch {
    console.log("Database: DATABASE_URL is not set or not a valid URL");
  }
  startSessionCleanupJob();
  startPartnerCommissionJob();
  startAutomationWorker();
  startMonitoringJob();
});
