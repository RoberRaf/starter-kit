#!/usr/bin/env node
// PreToolUse hook: before Claude Reads a .md file inside specs/,
// run `git pull` in that repo (debounced to once per 30 seconds).

import { spawnSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Change this when reusing the hook in another project.
const TASKS_DIR_NAME = "specs";
const DEBOUNCE_MS = 30_000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const TASKS_REPO = resolve(__dirname, "..", "..", TASKS_DIR_NAME);
const TASKS_REPO_PREFIX = TASKS_REPO + sep;
const DEBOUNCE_FILE = resolve(TASKS_REPO, ".last_pull");
const HEAD_FILE = resolve(TASKS_REPO, ".git", "HEAD");
const LOG_FILE = resolve(__dirname, "pre_read_tasks.log");
const DEBUG = process.env.DEBUG_HOOK === "1";

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stderr.write(line);
  if (DEBUG) { try { appendFileSync(LOG_FILE, line); } catch { /* never block the tool on logging */ } }
}

// Read stdin JSON payload.
let raw = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) raw += chunk;

let payload;
try {
  payload = JSON.parse(raw || "{}");
} catch {
  process.exit(0); // malformed payload — don't block the Read
}

const toolName = payload.tool_name;
if (toolName !== "Read") process.exit(0);
const toolInput = payload?.tool_input ?? {};

// Decide whether this invocation targets a task .md file.
let relevant = false;
if (typeof toolInput.file_path === "string") {
  const fp = toolInput.file_path;
  if (fp.length > 3 && (fp.endsWith(".md") || fp.endsWith(".MD"))) {
    relevant = resolve(fp).startsWith(TASKS_REPO_PREFIX);
  }
}

if (!relevant) process.exit(0);

log(`Read touched ${TASKS_DIR_NAME}/**/*.md`);

// Debounce.
const now = Date.now();
let last = 0;
try { last = Number(readFileSync(DEBOUNCE_FILE, "utf8").trim()) || 0; } catch { /* no debounce file yet */ }
if (last && now - last <= DEBOUNCE_MS) {
  const remaining = Math.ceil((DEBOUNCE_MS - (now - last)) / 1000);
  log(`debounced (${remaining}s remaining) — skipping pull`);
  process.exit(0);
}

// Pull.
log("running git pull");

const git = (...args) =>
  spawnSync("git", ["-C", TASKS_REPO, ...args], { stdio: ["ignore", "inherit", "inherit"] });

// Skip `git checkout main` if we're already on main (saves a subprocess spawn).
let onMain = false;
try { onMain = readFileSync(HEAD_FILE, "utf8").trim() === "ref: refs/heads/main"; } catch { /* fall through to checkout */ }
if (!onMain) {
  const checkout = git("checkout", "main");
  if (checkout.status !== 0) {
    log("git checkout main failed; continuing");
    process.exit(0);
  }
}

const pull = git("pull");
if (pull.status !== 0) {
  log("git pull failed; continuing");
  process.exit(0);
}

writeFileSync(DEBOUNCE_FILE, String(now));
log("git pull complete");
process.exit(0);
