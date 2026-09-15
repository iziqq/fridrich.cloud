# raw/ – neměnné zdroje

Vrstva **zdrojů** LLM Wiki: zadání, specifikace a rozhodnutí tak, jak je
dodal zadavatel. Agent je čte, ale **nikdy je neupravuje** – ani kvůli
zastaralé informaci nebo rozbitému odkazu. Aktuální, zkompilované znalosti
jsou ve [wiki/](../wiki/index.md); při rozporu platí wiki a rozpor se zapíše
do [wiki/log.md](../wiki/log.md).

Nový zdroj = nový soubor (`RRRR-MM-DD-nazev.md` u zadání s datem) a operace
**ingest** podle [CLAUDE.md](../../CLAUDE.md#knowledge-base-llm-wiki).

| Zdroj | Obsah | Zpracováno do |
|---|---|---|
| [iziweddy-specifikace.md](iziweddy-specifikace.md) | Původní specifikace svatebního plánovače. Kap. 3, 7, 9–11 popisují ještě samostatný repozitář a jsou překonané. | [domeny/weddy*.md](../wiki/domeny/weddy.md) |
| [portal-specifikace.md](portal-specifikace.md) | Specifikace portálu – obsah, navigace, cyberpunkový design systém. | [domeny/portal.md](../wiki/domeny/portal.md) |
| [izibudgy-zadani.md](izibudgy-zadani.md) | Hrubé zadání rozpočtu domácnosti a otázky před specifikací. | [domeny/budgy.md](../wiki/domeny/budgy.md) |
| [2026-09-15-domenova-architektura.md](2026-09-15-domenova-architektura.md) | Požadavek na doménovou architekturu FE i BE, soubor na endpoint, Valibot a LLM Wiki. | [architektura/](../wiki/architektura/domeny.md) |

> ℹ️ Odkazy uvnitř zdrojů míří na dokumenty v podobě, v jaké byly napsané
> (např. `architecture.md`). Ty už neexistují – jejich obsah je rozpuštěný
> ve wiki, původní text je v historii gitu (commit `8db5e0a`).
