```
TASKS_DIR = `../project-tasks`
```

# Project Sources of Truth

- **`../PRDs`** — Single source of truth for product business data
- **`../ux-spec`** — Single source of truth for design guide and UI/UX. Available Figma designs are a helper but should not conflict with the ux-spec
- **`../ux-spec/Design-System-Istidama.md`** — Single source of truth for design system and Typography
- **`../qa-hub`** — Single source of truth for test cases. These should be taken into consideration while implementing related features
- **`../lms-laravel/API-README.md`** — Full API reference (55 endpoints across 12 categories). Consult this for endpoint paths, request/response formats, auth requirements, and rate limits
- **`../docker/powersync/`** — Offline-first sync configuration: `sync-rules.yaml` (sync rules) and `powersync.yaml` (PowerSync config). Consult for understanding what data syncs to the client and how
- **`../lms-laravel/`** — Laravel backend. Consult for database table/column names when building PowerSync schema and `*DbService` SQL queries. Key locations: `../lms-laravel/database/` (migrations) and `../lms-laravel/Modules/` (module models)
- **TASKS_DIR** — Single source of truth for project tasks


----

## Task Management

All task file generation/edits (claiming, status updates, frontmatter changes) MUST be delegated to the **task-manager** subagent

**Never edit task files directly.** Always spawn the task-manager agent and pass it:
- **file**: the task filename (e.g. `task_one.md`)
- **action**: `creat`, `claim`, `update-status`, or `claim-and-update-status`
- **github_user**: the current user's GitHub username (optional)
- **status** (when updating): the new status value (e.g. `in-progress`, `done`, `todo`, `blocked`)

## Task Claiming Protocol

Before starting any task in `$TASKS_DIR/`, you MUST use the task-manager agent to:
1. Claim the task — the agent will check if `claimed_by` is already set
2. If claimed by someone else → STOP and report it to the user. Do not proceed.
3. If unclaimed → the agent will set `claimed_by` and `claimed_at`
4. If claimed by the current user → proceed normally
5. When finishing a task, use the task-manager agent with action `update-status` and status `done`.


## Completing a Task

When finishing a task, use the task-manager agent with action `update-status` and status `done`.


