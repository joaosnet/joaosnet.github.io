## graphify & Knowledge Graph First

This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.

Rules:
- When `graphify-out/graph.json` exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question. Read raw files only for lines the graph or an earlier read already located.
- Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Architecture & Security Reference: `docs/architecture-security-isolation.md`.
- Subagents: Always inject exact graph nodes/wiki links; never dispatch open-ended exploratory subagents.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
