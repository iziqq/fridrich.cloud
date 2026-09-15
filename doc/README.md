# doc/ – znalostní báze (LLM Wiki)

Dokumentace projektu je vedená podle konceptu **LLM Wiki** Andreje Karpathyho:
znalosti se nedohledávají pokaždé znovu v kódu a starých dokumentech, ale
agent je průběžně kompiluje do provázaných stránek, které udržuje aktuální.

| Vrstva | Kde | Kdo píše | K čemu |
|---|---|---|---|
| **Zdroje** | [raw/](raw/README.md) | zadavatel | Neměnná zadání a specifikace. Agent je čte, nikdy neupravuje. |
| **Wiki** | [wiki/](wiki/index.md) | agent | Stránky o architektuře, doménách a provozu. Aktuální pravda o projektu. |
| **Schéma** | [CLAUDE.md](../CLAUDE.md) | zadavatel + agent | Jak je wiki organizovaná, jak se do ní zapisuje a jaká jsou pravidla kódu. |

Začni v **[wiki/index.md](wiki/index.md)** (katalog stránek), historie změn
je ve **[wiki/log.md](wiki/log.md)**.

Stránky jsou obyčejný Markdown s YAML hlavičkou a relativními odkazy – čtou se
na GitHubu, ve VS Code i v Obsidianu (otevřít `doc/` jako vault).
