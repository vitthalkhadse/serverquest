import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import client from "prom-client";
import { runCommand } from "./engine.js";
import {
  cleanPlayer,
  cleanAttempts,
  cleanCommand,
  cleanId,
} from "./validate.js";

const pool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

client.collectDefaultMetrics();
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // sirf nginx ke peeche
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "upgrade-insecure-requests": null, // HTTP pe CSS/JS block na ho
      },
    },
  }),
);
app.use(cors({ origin: process.env.CORS_ORIGIN || false })); // default: same-origin only
app.use(express.json({ limit: "2kb" }));

// JSON access log -> Loki/Grafana mein dikhega
app.use((req, res, next) => {
  const t = Date.now();
  res.on("finish", () =>
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Date.now() - t,
        ip: req.ip,
      }),
    ),
  );
  next();
});

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

app.get(
  ["/health", "/api/health"],
  wrap(async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", db: "up" });
    } catch {
      res.status(503).json({ status: "error", db: "down" });
    }
  }),
);
// /metrics sirf internal network ke liye (nginx ise bahar expose nahi karta)
app.get(
  "/metrics",
  wrap(async (_req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  }),
);

const limiter = (limit) =>
  rateLimit({
    windowMs: 60_000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
  });
app.use("/api", limiter(120));

app.get(
  "/api/levels",
  wrap(async (_req, res) => {
    const { rows } = await pool.query(
      "SELECT id, slug, title, difficulty, story, hint FROM levels ORDER BY id",
    );
    res.json(rows);
  }),
);

app.post(
  "/api/levels/:id/command",
  limiter(30),
  wrap(async (req, res) => {
    const id = cleanId(req.params.id);
    const command = cleanCommand(req.body?.command);
    if (id === null || command === null)
      return res.status(400).json({ error: "bad request" });
    const { rows } = await pool.query("SELECT * FROM levels WHERE id = $1", [
      id,
    ]);
    if (!rows.length) return res.status(404).json({ error: "level not found" });
    const result = runCommand(rows[0], command);
    if (result.solved) {
      await pool.query(
        "INSERT INTO scores (player, level_id, attempts) VALUES ($1, $2, $3)",
        [cleanPlayer(req.body?.player), id, cleanAttempts(req.body?.attempts)],
      );
    }
    res.json(result);
  }),
);

app.get(
  "/api/leaderboard",
  wrap(async (_req, res) => {
    const { rows } = await pool.query(`
      SELECT player, COUNT(*)::int AS solved, SUM(best)::int AS total_attempts
      FROM (SELECT player, level_id, MIN(attempts) AS best FROM scores GROUP BY player, level_id) t
      GROUP BY player ORDER BY solved DESC, total_attempts ASC LIMIT 10`);
    res.json(rows);
  }),
);

app.use("/api", (_req, res) => res.status(404).json({ error: "not found" }));

// Frontend (Vite build) isi server se serve hota hai. Local dev mein public folder nahi hota, to skip.
const publicDir = fileURLToPath(new URL("../public", import.meta.url));
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { maxAge: "1h" }));
  app.get("*", (_req, res) => res.sendFile(path.join(publicDir, "index.html")));
}

// Error pe stack trace kabhi bahar nahi jaata
app.use((err, _req, res, _next) => {
  console.error(err.message);
  const status = err.status && err.status < 500 ? err.status : 500;
  res
    .status(status)
    .json({ error: status < 500 ? "bad request" : "server error" });
});

async function initDb(retries = 20) {
  const sql = fs.readFileSync(
    new URL("../db/init.sql", import.meta.url),
    "utf8",
  );
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query(sql);
      console.log("DB ready");
      return;
    } catch (e) {
      console.log(`DB not ready (${e.code || e.message}), retry ${i + 1}...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("DB connect failed");
}

await initDb();
const port = process.env.PORT || 5000;
const server = app.listen(port, () => console.log(`Backend on :${port}`));

// Graceful shutdown: deploy ke time chalti requests poori hone do (zero-downtime)
for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => {
    server.close(() => pool.end().then(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
