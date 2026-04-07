# Generate Task

Generate a new task or cycle file.

**Input**: `$ARGUMENTS`
- First word = task/cycle filename (without `.md` extension, e.g. `task_one` or `cycle_2`)
- Remaining words (if any) = high-priority user instructions that MUST be followed

## Steps

1. **Get GitHub username**: Run `gh api user --jq .login` to get the current user's GitHub username.

2. **Parse arguments**:
   - Split `$ARGUMENTS` on the first space
   - `TASK_NAME` = first word
   - `USER_INSTRUCTIONS` = everything after the first word (may be empty)

3. **Check for duplicates**: Check if `$TASKS_DIR/{TASK_NAME}.md` already exists. If it does, report the conflict and stop (unless user instructions say otherwise).

4. **Apply user instructions**: If `USER_INSTRUCTIONS` is not empty, these are high-priority directives that shape the generated task content. Follow them exactly.

5. **Delegate to task-manager**: Spawn the `@.claude/agents/task-manager.md` agent with:
   - **file**: `{TASK_NAME}.md`
   - **action**: `create`
   - **github_user**: the GitHub username from step 1
   - **status**: `todo` (default for new tasks, unless user instructions specify otherwise)

6. **Report result** to the user, including the path to the created file.
