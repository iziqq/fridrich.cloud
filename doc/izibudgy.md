# 💰 IziBudgy – rozpočet domácnosti

> **Stav: TODO.** Zatím jen zadání a hrubý směr. Specifikace se dopisuje až po
> dokončení portálu a IziWeddy.

Aplikace na rozpočet domácnosti – přehled příjmů, výdajů a úspor.

| | |
|---|---|
| **Adresa** | `www.fridrich.cloud/izi-budgy` |
| **Modul API** | `/api/budgy/*` |
| **Frontend** | `apps/izibudgy` |
| **Sdílené typy** | `packages/budgy-shared` |
| **Identita** | Společný účet `fridrich.cloud` – viz [architecture.md, kap. 5](architecture.md#5-identita-registrace-a-přihlášení) |

---

## Hrubý směr

Předpokládané jádro aplikace – **nutno potvrdit a rozpracovat**:

- **Domácnost** – jednotka, kterou může sdílet víc uživatelů.
- **Účty** – běžný účet, spořicí účet, hotovost.
- **Kategorie** – bydlení, jídlo, doprava, děti, zábava…
- **Transakce** – příjem / výdaj, částka, datum, kategorie, účet, poznámka.
- **Pravidelné platby** – nájem, energie, předplatné; opakování a připomenutí.
- **Měsíční rozpočet** – plánovaná částka na kategorii vs. skutečnost.
- **Přehledy** – vývoj v čase, rozpad podle kategorií, zůstatek.

## Otázky k zodpovězení před psaním specifikace

| # | Otázka |
|---|---|
| 1 | Zadává se všechno ručně, nebo se má importovat bankovní výpis (CSV / API banky)? |
| 2 | Sdílí rozpočet víc lidí (partneři), nebo je to jednouživatelská aplikace? |
| 3 | Jen jedna měna (CZK), nebo víc měn? |
| 4 | Jsou potřeba úvěry a splátky, nebo stačí příjmy a výdaje? |
| 5 | Řeší se spořicí cíle („na dovolenou 60 000 Kč")? |
| 6 | Jak daleko do minulosti se má počítat historie a přehledy? |

Až budou odpovědi, vznikne dokument ve stejné struktuře jako
[iziweddy.md](iziweddy.md) – doménový model, funkční specifikace, REST API,
validační pravidla, ukládání dat.
