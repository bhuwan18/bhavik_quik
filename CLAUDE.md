# CLAUDE.md — AI Assistant Guide for bhavik_quik

This file provides guidance for AI assistants (Claude and others) working in this repository. Read this before making any changes.

---

## Project Overview

**Repository:** bhavik_quik
**Owner:** bhuwan18
**Status:** Early initialization — no application source code exists yet.

The project is freshly created. When a technology stack and purpose are defined, this file should be updated to reflect the actual structure, commands, and conventions.

---

## Current Repository Structure

```
bhavik_quik/
├── CLAUDE.md        ← this file
└── README.md        ← project heading only
```

As the project grows, adopt a conventional layout appropriate for the chosen stack (e.g., `src/`, `tests/`, `docs/`, `scripts/`). Update this section when structure is established.

---

## Development Workflow

### Branches

- The default branch is `master`.
- AI-driven feature branches must use the prefix `claude/` (e.g., `claude/feature-name-<session-id>`).
- Never push directly to `master` without explicit user permission.

### Commits

- Write clear, present-tense commit messages that describe *why*, not just *what*.
- Example: `Add user authentication middleware` rather than `changed auth.js`.
- Keep commits focused — one logical change per commit.

### Pushing

Always push with upstream tracking:

```bash
git push -u origin <branch-name>
```

Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s) on network failures.

---

## Key Conventions for AI Assistants

### Before Making Changes

- **Read files before editing them.** Never assume file contents.
- **Search the codebase** for existing utilities or patterns before writing new code.
- **Understand the existing code** before suggesting modifications.

### Making Changes

- Make the **minimum necessary change** for the task. Do not refactor surrounding code unless asked.
- Do not add comments, docstrings, or type annotations to code you did not write or change.
- Do not add error handling for scenarios that cannot happen.
- Do not create new files unless they are clearly required.
- Do not introduce abstractions or helpers for one-time use.

### Destructive / Risky Operations

- **Always confirm with the user** before:
  - Deleting files or branches
  - Force-pushing (`--force`)
  - Running `git reset --hard`
  - Dropping database tables or data
  - Modifying CI/CD pipelines or shared infrastructure
- Do not use `--no-verify` to skip hooks — fix the underlying issue instead.
- Investigate unexpected files, branches, or config before overwriting them.

### Security

- Never introduce SQL injection, XSS, command injection, or other OWASP Top 10 vulnerabilities.
- Do not commit secrets, credentials, or `.env` files.
- Validate input only at system boundaries (user input, external APIs); trust internal code.

---

## Testing

No test framework has been configured yet.

When source code is added, set up an appropriate testing framework (e.g., Jest/Vitest for JS/TS, pytest for Python) and document the test commands here:

```bash
# Example — replace with actual commands once configured
npm test
pytest
```

Always run tests before committing when a test suite exists.

---

## Getting Started

Once a technology stack is chosen, update this section with:

1. Prerequisites (Node.js version, Python version, etc.)
2. Installation steps (`npm install`, `pip install -r requirements.txt`, etc.)
3. How to run the development server
4. How to run tests
5. Environment variable setup (`.env.example`)

---

## Updating This File

Keep CLAUDE.md current. When the project gains:
- A tech stack → update **Project Overview** and **Getting Started**
- Source code structure → update **Repository Structure**
- Test framework → update **Testing**
- Scripts or Makefile targets → add a **Commands** section
- CI/CD → add a **CI/CD** section

This file is the primary reference for any AI assistant working in this repo.
