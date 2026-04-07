#!/usr/bin/env node
// PostToolUse hook: after Claude edits a .md file inside project-tasks/,
// stage, commit, and push that file so the remote stays in sync.

import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { basename, dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Change this when reusing the hook in another project.
const TASKS_DIR_NAME = "project-tasks";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TASKS_REPO = resolve(__dirname, "..", "..", TASKS_DIR_NAME);
const TASKS_REPO_PREFIX = TASKS_REPO + sep;
const LOG_FILE = resolve(__dirname, "post_edit_tasks.log");
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
  process.exit(0); // malformed payload — don't block the tool result
}

const toolName = payload.tool_name;
if (toolName !== "Edit" && toolName !== "Write" && toolName !== "MultiEdit") process.exit(0);
const toolInput = payload?.tool_input ?? {};

// Resolve the edited file path.
const rawPath = toolInput.file_path;
if (typeof rawPath !== "string" || rawPath.length < 4) process.exit(0);
if (!(rawPath.endsWith(".md") || rawPath.endsWith(".MD"))) process.exit(0);

const absPath = resolve(rawPath);
if (!absPath.startsWith(TASKS_REPO_PREFIX)) process.exit(0);

const relPath = relative(TASKS_REPO, absPath);
const fileName = basename(absPath);

log(`${toolName} touched ${TASKS_DIR_NAME}/${relPath}`);

const git = (...args) =>
  spawnSync("git", ["-C", TASKS_REPO, ...args], { stdio: ["ignore", "inherit", "inherit"] });

// Stage the edited file.
const add = git("add", "--", relPath);
if (add.status !== 0) {
  log("git add failed; continuing");
  process.exit(0);
}

// Skip commit if the edit resulted in no staged change.
const diff = git("diff", "--cached", "--quiet", "--", relPath);
if (diff.status === 0) {
  log("no staged changes — skipping commit");
  process.exit(0);
}

const commit = git("commit", "-m", `chore: update ${fileName} via Claude Code`);
if (commit.status !== 0) {
  log("git commit failed; continuing");
  process.exit(0);
}

const push = git("push");
if (push.status !== 0) {
  log("git push failed; continuing");
  process.exit(0);
}

log("git push complete");
process.exit(0);
