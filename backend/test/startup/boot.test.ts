import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Boots the real server entry (src/index.ts) with a minimal environment: only OS basics + a DATABASE_URL
// pointing at an unreachable address. Guards against import-time "X is required" crashes on a fresh deployment.
const KEEP = ["PATH", "Path", "SystemRoot", "SYSTEMROOT", "windir", "TEMP", "TMP", "TMPDIR", "ComSpec", "PATHEXT", "SystemDrive", "USERPROFILE", "HOME", "APPDATA", "LOCALAPPDATA", "NUMBER_OF_PROCESSORS", "PROCESSOR_ARCHITECTURE"];

describe("server startup with a minimal environment", () => {
  it("starts listening without RESEND/SMTP/SUPPORT_EMAIL/WhatsApp-link/etc. variables set", async () => {
    const backend = process.cwd();
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "boot-"));
    const env: NodeJS.ProcessEnv = {};
    for (const k of KEEP) if (process.env[k] !== undefined) env[k] = process.env[k];
    Object.assign(env, {
      DATABASE_URL: "postgresql://nobody:nothing@127.0.0.1:1/none",
      PORT: "0",
      TSX_TSCONFIG_PATH: path.join(backend, "tsconfig.json"),
    });
    const child = spawn(process.execPath, ["--import", pathToFileURL(path.join(backend, "node_modules", "tsx", "dist", "loader.mjs")).href, path.join(backend, "src", "index.ts")], { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    const result = await new Promise<"listening" | "exited">((resolve) => {
      const timer = setTimeout(() => resolve("exited"), 30000);
      child.on("exit", () => { clearTimeout(timer); resolve("exited"); });
      const poll = setInterval(() => {
        if (/Server is running/.test(out)) { clearInterval(poll); clearTimeout(timer); resolve("listening"); }
      }, 100);
      child.on("exit", () => clearInterval(poll));
    });
    const closed = new Promise((r) => child.once("close", r));
    child.kill();
    await Promise.race([closed, new Promise((r) => setTimeout(r, 3000))]);
    try { fs.rmSync(cwd, { recursive: true, force: true }); } catch { /* best effort: temp dir */ }
    assert.equal(result, "listening", out.slice(-1500));
  });
});
