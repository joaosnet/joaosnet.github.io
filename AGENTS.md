## graphify & Knowledge Graph First

This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

### Rules for All Agents & Subagents:
1. **Zero Speculative Scanning (Anti-Token-Waste)**:
   - NEVER run `Get-ChildItem -Recurse`, `ls -R`, or open multiple files blindly across the repository.
   - When `graphify-out/graph.json` exists, run `graphify query "<question>"` (CLI) or use MCP `query_graph` before your first grep, search, or file read.
   - If `graphify-out/wiki/index.md` exists, use it for broad architectural navigation instead of raw source browsing.
   - Use `graphify path "<A>" "<B>"` / `shortest_path` for relationships and `graphify explain "<concept>"` / `get_node` for focused concepts.
   - Read raw files only for lines the graph or an earlier read already located.
2. **Subagent Delegation Protocol**:
   - Parent agents must NEVER dispatch subagents with vague prompts ("explore the codebase").
   - Parent agents MUST query the graph first and inject the exact target files, symbols, or wiki article links into the subagent prompt.
3. **Architecture & Security Governance**:
   - Canonical Architecture & Isolation Reference: `docs/architecture-security-isolation.md`.
   - `main()` in `update_projects.py` acts as the bridge orchestrator between executable build logic and documentation review policies (`docs/preview-review.md`).
   - `private_preview()` strictly requires local `.private-preview/allowlist.json` and `PRIVATE_REPOS_TOKEN`; it fails fast without network access if the token is missing.
   - Configuration tests use synthetic environments (`tests/test_env_variables.py`); never open or commit a developer's `.env`.
4. **Maintenance & Hooks**:
   - After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
   - Git hooks (`post-commit`, `post-merge`, `post-checkout`) automatically synchronize the graph without token consumption.
   - Temporary test fixtures (`.pytest_tmp/`, `.pytest_cache/`, `__pycache__/`) are excluded by `.graphifyignore` and must never enter the graph.
