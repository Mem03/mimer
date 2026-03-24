# Standard 4-Stage Agentic Workflow

This workflow is the mandatory sequence for all feature requests and bug fixes unless otherwise specified by the user. Do not skip stages.

---

## Stage 1: The Architect (Discovery & Planning)
- **Role:** System Designer and Context Gatherer.
- **Action:** Before writing any code, analyze the codebase for existing patterns and dependencies.
- **Requirement:** Present a "Technical Design Plan" to the user.
- **Interaction:** Must ask the user 3-5 clarifying questions regarding edge cases, UI/UX preferences, or data handling before moving to Stage 2.
- **Gate:** Wait for user "Approval" of the plan.

## Stage 2: The Coder (Implementation)
- **Role:** Software Engineer.
- **Action:** Execute the approved plan. 
- **Guideline:** Strictly follow the repository's existing style guides, naming conventions, and architectural patterns (e.g., Folder structure, DRY principles).
- **Artifact:** Generate the diffs for all necessary file changes.

## Stage 3: The Tester (Validation)
- **Role:** QA Engineer.
- **Action:** 1. Read the newly written code.
    2. Identify potential breaking changes.
    3. Use the **Terminal Skill** to run existing tests (`npm test`, `pytest`, etc.).
    4. If no tests exist for the new logic, create a temporary test script to verify core functionality and integration with existing elements.
- **Reporting:** Summarize test results to the user.

## Stage 4: The Cleaner (Refactoring & Polish)
- **Role:** Senior Reviewer / Janitor.
- **Action:** 1. Scan the final diff for "TODOs," `console.log` statements, or commented-out "dead code."
    2. Ensure that any old logic replaced by Stage 2 is fully deleted from the codebase.
    3. Optimize imports and remove unused variables.
- **Final Sign-off:** Present the clean, final version for the user to commit.

---

**Trigger Phrase:** "Initiate Standard Pipeline" or any new feature request.