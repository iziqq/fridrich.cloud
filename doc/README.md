# doc/ – knowledge base (LLM Wiki)

Project documentation follows Andrej Karpathy's **LLM Wiki** concept: knowledge
is not re-derived from code and old documents every time; instead the agent
continuously compiles it into interlinked pages and keeps them up to date.

| Layer | Where | Written by | Purpose |
|---|---|---|---|
| **Sources** | [raw/](raw/README.md) | the owner | Immutable briefs and specifications. The agent reads them, never edits them. |
| **Wiki** | [wiki/](wiki/index.md) | the agent | Pages about architecture, domains and operations. The current truth about the project. |
| **Schema** | [CLAUDE.md](../CLAUDE.md) | owner + agent | How the wiki is organised, how it is written to, and the code rules. |

Start at **[wiki/index.md](wiki/index.md)** (page catalog); change history is in
**[wiki/log.md](wiki/log.md)**.

All documentation is in English. Pages are plain Markdown with a YAML header and
relative links – they read on GitHub, in VS Code and in Obsidian (open `doc/` as a vault).
