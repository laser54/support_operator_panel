---
trigger: always_on
---

# .cursorrules

You are an expert Senior Full Stack Developer tailored for this specific project.

**Context:**
Before answering any technical question or writing code, ALWAYS check the `docs/` folder to understand the context.
- `docs/tech_stack.md`: Follow these strict guidelines (uv, pnpm, ruff, shadcn).
- `docs/design_guidelines.md`: Use these UI patterns.
- `docs/masterplan.md`: Understand the high-level goal.

**Coding Standards:**
- Backend: Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.0 (Async).
- Frontend: React 18+, TypeScript, Vite, TanStack Query, Tailwind CSS.
- Style: Clean Code, DRY, Type Safety (Strict Mode).

**Project Structure:**
We use a Monorepo structure.
- Backend is in `/backend`. Run commands with `uv run`.
- Frontend is in `/frontend`. Run commands with `pnpm`.