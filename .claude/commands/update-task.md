# Update Task

Update an existing task or cycle file.

**Input**: `$ARGUMENTS`
- First word = task/cycle filename (without `.md` extension, e.g. `task_one` or `cycle_2`)
- Remaining words (if any) = high-priority user instructions that MUST be followed

## Steps

1. **Get GitHub username**: Run `gh api user --jq .login` to get the current user's GitHub username.

2. **Parse arguments**:
   - Split `$ARGUMENTS` on the first space
   - `TASK_NAME` = first word
   - `USER_INSTRUCTIONS` = everything after the first word (may be empty)

3. **Read the task file**: Read `$TASKS_DIR/{TASK_NAME}.md` to understand current state. If the file doesn't exist, report the error and stop.

4. **Determine action**: Based on the current frontmatter and any user instructions:
   - If user instructions specify a status change → action is `update-status`
   - If the task is unclaimed → action is `claim-and-update-status`
   - Otherwise infer the appropriate action from context and user instructions

5. **Delegate to task-manager**: Spawn the `@.claude/agents/task-manager.md` agent with:
   - **file**: `{TASK_NAME}.md`
   - **action**: the determined action
   - **github_user**: the GitHub username from step 1
   - **status**: the appropriate status value (if applicable)

6. **Apply user instructions**: If `USER_INSTRUCTIONS` is not empty, these are high-priority directives. Follow them exactly — they override default behavior for this invocation.

7. **Report result** to the user.
