## graphify & Knowledge Graph First

This project has a graphify knowledge graph at `graphify-out/`.

### Rules:
1. **Zero Speculative Scanning (Anti-Token-Waste)**:
   - For codebase or architecture questions, when `graphify-out/graph.json` exists, first run `graphify query "<question>"` (CLI) or `query_graph` (MCP).
   - If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files.
   - Use `graphify path "<A>" "<B>"` / `shortest_path` for relationships and `graphify explain "<concept>"` / `get_node` for focused concepts.
   - Read raw files only for lines the graph or an earlier read already located.
2. **Subagent Delegation Protocol**:
   - The parent agent must NEVER dispatch subagents with open-ended exploratory tasks.
   - Inject the exact file paths, symbols, or wiki article links identified by the graph into the subagent prompt.
3. **Architecture & Security Governance**:
   - Reference `docs/architecture-security-isolation.md` for system topology, governance, and security boundaries.
   - `main()` in `update_projects.py` connects `Site Build Logic` to `Analytics and Review Docs`.
   - `private_preview()` requires explicit local allowlist and fails safely without network if token is missing.
   - Test suites use synthetic environments (`tests/test_env_variables.py`); never access or leak developer `.env` files.
4. **Maintenance & Cleanliness**:
   - After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost).
   - Git hooks keep the graph fresh automatically on commits and checkouts.
