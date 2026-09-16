/**
 * Zásady ochrany osobních údajů a obchodní podmínky.
 *
 * Lhůty a verze se berou ze sdíleného jádra (`@fridrich/shared`), ze kterého
 * je čte i API – text dokumentu tak nemůže slibovat jinou lhůtu, než jakou
 * kód opravdu dodržuje. Při změně toho, co web o lidech ukládá, se musí
 * upravit i tento soubor a zvednout verze (doc/wiki/architecture/personalData.md).
 */

import {
  CONTACT_MESSAGE_RETENTION_DAYS,
  INACTIVE_ACCOUNT_RETENTION_DAYS,
  WEDDING_INVITATION_RETENTION_DAYS,
  INACTIVE_ACCOUNT_WARNING_DAYS,
  PRIVACY_POLICY_VERSION,
  TERMS_VERSION,
} from '@fridrich/shared';
import { site } from './site';

export type LegalBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  label: string;
  title: string;
  lead: string;
  /** Datum účinnosti ve tvaru YYYY-MM-DD – zároveň verze dokumentu. */
  version: string;
  sections: LegalSection[];
}

/** `2026-09-15` → `15. 9. 2026` */
export function formatLegalDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${day}. ${month}. ${year}`;
}

const operator = `${site.name}, ${site.legalForm}, IČO ${site.ico}, se sídlem ${site.address}`;

/** 365 dní se v právním textu čte lépe jako „1 rok“. */
const contactRetention = CONTACT_MESSAGE_RETENTION_DAYS === 365 ? '1 rok' : `${CONTACT_MESSAGE_RETENTION_DAYS} dní`;
const invitationRetention = `${WEDDING_INVITATION_RETENTION_DAYS} dní`;

export const privacyPolicy: LegalDocument = {
  label: 'Ochrana osobních údajů',
  title: 'Zásady ochrany osobních údajů',
  lead: `Tyto zásady vysvětlují, jaké osobní údaje zpracovávám, když používáte web ${site.domain}, kontaktní formulář, uživatelský účet nebo aplikace IziWeddy a IziBudgy, proč to dělám, jak dlouho údaje uchovávám a jaká máte práva.`,
  version: PRIVACY_POLICY_VERSION,
  sections: [
    {
      id: 'spravce',
      title: '1. Správce osobních údajů',
      blocks: [
        {
          kind: 'paragraph',
          text: `Správcem osobních údajů je ${operator} (dále jen „správce“ nebo „já“).`,
        },
        {
          kind: 'paragraph',
          text: `Ve všech záležitostech ochrany osobních údajů mě kontaktujte na e-mailu ${site.email}. Pověřence pro ochranu osobních údajů jmenovaného nemám, protože mi to právní předpisy neukládají.`,
        },
      ],
    },
    {
      id: 'udaje',
      title: '2. Jaké údaje zpracovávám, proč a jak dlouho',
      blocks: [
        {
          kind: 'table',
          head: ['Kdy', 'Jaké údaje', 'Účel a právní základ', 'Jak dlouho'],
          rows: [
            [
              'Kontaktní formulář',
              'jméno, e-mail, text zprávy, otisk (hash) IP adresy',
              'Odpověď na poptávku a jednání o zakázce – opatření před uzavřením smlouvy na vaši žádost (čl. 6 odst. 1 písm. b) GDPR). Otisk IP adresy slouží k ochraně formuláře proti zneužití – oprávněný zájem (čl. 6 odst. 1 písm. f) GDPR). Samotnou IP adresu neukládám; z otisku ji nelze zpětně zjistit.',
              `Zpráva ${contactRetention} od přijetí, poté se automaticky smaže. Otisk IP adresy v počítadle pokusů nejvýše 24 hodin. Vznikne-li z poptávky zakázka, uchovávám komunikaci po dobu trvání smlouvy a promlčecí lhůty.`,
            ],
            [
              'Uživatelský účet',
              'jméno, e-mail, datum registrace, stav ověření e-mailu, verze a datum souhlasu s obchodními podmínkami, datum poslední aktivity, zvolený jazyk rozhraní',
              'Vedení účtu a poskytování služeb podle obchodních podmínek – plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR). Záznam o souhlasu s podmínkami – oprávněný zájem na prokázání uzavření smlouvy (písm. f).',
              `Do smazání účtu. Účet, do kterého se ${INACTIVE_ACCOUNT_RETENTION_DAYS} dní nepřihlásíte, smažu; ${INACTIVE_ACCOUNT_WARNING_DAYS} dní předem vás upozorním e-mailem.`,
            ],
            [
              'Přihlašování a zabezpečení',
              'otisky (hashe) aktivačních odkazů, přihlašovacích kódů a přihlášení; otisky IP adresy a e-mailu u omezení počtu pokusů',
              'Přihlášení bez hesla a ochrana účtu před zneužitím – plnění smlouvy a oprávněný zájem (čl. 6 odst. 1 písm. b) a f) GDPR). V počítadlech pokusů leží jen otisky, ne samotná adresa ani e-mail.',
              'Aktivační odkaz 30 dní, přihlašovací kód 1 hodinu, záznam o přihlášení 60 dní (přihlášení platí 30 dní), počítadla pokusů nejvýše 24 hodin.',
            ],
            [
              'Aplikace IziWeddy',
              'název a datum svatby; jméno a příjmení snoubenců; jméno, příjmení, strana, věková skupina, stav pozvání, rodina a poznámka u hostů; položky příprav (název, odkaz, cena, stav)',
              'Poskytování aplikace podle obchodních podmínek – plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR). Údaje snoubenců a hostů zadává uživatel a zpracovávám je jen proto, aby mu aplikace fungovala.',
              'Do smazání plánování nebo účtu, včetně automatického smazání neaktivního účtu.',
            ],
            [
              'Aplikace IziBudgy',
              'položky rozpočtu domácnosti – název, částka, kategorie, datum nebo platnost od–do a poznámka; příjmy i výdaje',
              'Poskytování aplikace podle obchodních podmínek – plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR). Rozpočet vidí jen ten, kdo ho zadal; nesdílí se s nikým dalším.',
              'Do smazání položky nebo účtu, včetně automatického smazání neaktivního účtu.',
            ],
            [
              'Sdílení plánování v IziWeddy',
              'e-mail pozvaného člověka a jeho otisk, zvolená role; u lidí s účtem seznam uživatelů, kteří k plánování mají přístup, a jejich role',
              'Sdílení plánování s dalšími lidmi na žádost uživatele – plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR); u pozvaného, který účet nemá, oprávněný zájem na doručení pozvánky (písm. f).',
              `Nepřijatá pozvánka ${invitationRetention} od odeslání, poté se automaticky smaže. Po registraci se změní na přístup k plánování a trvá do odebrání přístupu, smazání plánování nebo účtu.`,
            ],
            [
              'E-maily ze systému',
              'e-mailová adresa a obsah zprávy (aktivační odkaz, přihlašovací kód, upozornění, potvrzení smazání)',
              'Doručení zpráv nutných pro fungování účtu – plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR).',
              'Kopie v e-mailové schránce nejvýše 1 rok.',
            ],
            [
              'Cookie přihlášení',
              'fc_session – náhodný identifikátor přihlášení',
              'Udržení přihlášení – technicky nezbytná cookie, souhlas se nevyžaduje (§ 89 odst. 3 zákona č. 127/2005 Sb., o elektronických komunikacích).',
              '30 dní nebo do odhlášení.',
            ],
          ],
        },
      ],
    },
    {
      id: 'cookies',
      title: '3. Cookies a měření návštěvnosti',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Web používá jedinou cookie fc_session, a to jen po přihlášení. Je technicky nezbytná, obsahuje náhodný identifikátor, ne vaše údaje, a skripty na stránce ji nemohou přečíst.',
        },
        {
          kind: 'paragraph',
          text: 'Když si přepnete jazyk webu, prohlížeč si vaši volbu zapamatuje v místním úložišti (localStorage, položka fc_locale). Uloží se jen kód jazyka (cs nebo en), na server se neposílá a smažete ji vymazáním dat webu v prohlížeči. Jde o nastavení, které si sami zvolíte, proto nevyžaduje souhlas.',
        },
        {
          kind: 'paragraph',
          text: 'Nepoužívám analytické ani reklamní cookies, neměřím návštěvnost a nevkládám obsah třetích stran (mapy, videa, sociální sítě). Písma jsou uložená přímo na webu, takže se při načtení stránky nevolají cizí servery.',
        },
      ],
    },
    {
      id: 'zpracovatele',
      title: '4. Kdo s údaji pracuje',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Údaje nikomu neprodávám ani nepředávám pro marketing. K provozu webu využívám tyto zpracovatele, kteří s údaji pracují jen podle mých pokynů:',
        },
        {
          kind: 'list',
          items: [
            'Microsoft Ireland Operations Limited (Irsko) – hosting webu a aplikací (Azure Static Web Apps) a databáze (Azure Cosmos DB).',
            'Google Ireland Limited (Irsko) – odesílání a příjem e-mailů (Gmail), včetně zpráv z kontaktního formuláře.',
          ],
        },
        {
          kind: 'paragraph',
          text: 'Tito poskytovatelé mohou údaje v rámci svých služeb zpracovávat i mimo Evropský hospodářský prostor, zejména ve Spojených státech. Takové předání se opírá o rozhodnutí Evropské komise o odpovídající ochraně (EU-U.S. Data Privacy Framework), k němuž se oba poskytovatelé připojili, případně o standardní smluvní doložky schválené Evropskou komisí.',
        },
        {
          kind: 'paragraph',
          text: 'Údaje mohu předat také orgánům veřejné moci, pokud mi to uloží zákon.',
        },
      ],
    },
    {
      id: 'mazani',
      title: '5. Jak se údaje mažou',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Mazání probíhá automaticky: zprávy z formuláře a technické záznamy maže databáze sama po uplynutí lhůty z tabulky výše, neaktivní účty maže každý den plánovač. Kopie zpráv v e-mailové schránce mažu nejpozději po 1 roce.',
        },
        {
          kind: 'paragraph',
          text: 'Smazaná data mohou ještě krátce přetrvat v technických zálohách databáze, které se automaticky přepisují, nejpozději do 30 dnů.',
        },
      ],
    },
    {
      id: 'prava',
      title: '6. Vaše práva',
      blocks: [
        {
          kind: 'list',
          items: [
            'Přístup – můžete zjistit, jaké údaje o vás zpracovávám, a získat jejich kopii (čl. 15 GDPR).',
            'Oprava – nepřesné údaje opravím (čl. 16 GDPR).',
            'Výmaz – účet i se všemi daty si smažete sami po přihlášení v sekci Můj účet → Smazat účet; smazání je okamžité a nevratné. O smazání ostatních údajů, například zprávy z formuláře, mě můžete požádat e-mailem (čl. 17 GDPR).',
            'Omezení zpracování – můžete požádat, abych údaje do vyřešení sporu jen uchovával (čl. 18 GDPR).',
            'Přenositelnost – údaje z účtu vám na požádání pošlu ve strojově čitelném formátu (čl. 20 GDPR).',
            'Námitka – proti zpracování na základě oprávněného zájmu můžete vznést námitku (čl. 21 GDPR).',
            'Stížnost – můžete se obrátit na Úřad pro ochranu osobních údajů, Pplk. Sochora 27, 170 00 Praha 7, www.uoou.gov.cz.',
          ],
        },
        {
          kind: 'paragraph',
          text: `Žádosti posílejte na ${site.email}. Vyřídím je bez zbytečného odkladu, nejpozději do jednoho měsíce. Abych údaje nevydal nebo nesmazal někomu jinému, mohu vás požádat o potvrzení, že žádost posíláte z e-mailu, pod kterým účet vedete.`,
        },
      ],
    },
    {
      id: 'povinnost',
      title: '7. Musíte údaje poskytnout?',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Poskytnutí údajů je dobrovolné. Bez jména a e-mailu ale nejde založit účet ani odpovědět na poptávku. Nedochází k automatizovanému rozhodování ani profilování.',
        },
      ],
    },
    {
      id: 'treti-osoby',
      title: '8. Údaje dalších osob v IziWeddy',
      blocks: [
        {
          kind: 'paragraph',
          text: 'V aplikaci IziWeddy zadáváte údaje o dalších lidech – snoubencích a hostech. Zadávejte jen údaje, které pro plánování potřebujete. Nepoužívám je k žádnému jinému účelu, nikoho z nich nekontaktuji a hosté od webu nedostávají žádné e-maily. Smažete-li plánování nebo účet, smažou se i tyto údaje.',
        },
        {
          kind: 'paragraph',
          text: `Pozvete-li někoho ke sdílení plánování, pošlu na zadanou adresu jedinou zprávu s pozvánkou. Zvete proto jen lidi, kteří o to stojí. Pokud pozvaný účet nemá, uchovám jeho e-mail nejvýše ${invitationRetention}, než pozvánka propadne; pozvánku můžete kdykoli zrušit v nastavení plánování. Kdo přístup dostane, vidí celé plánování včetně údajů hostů.`,
        },
      ],
    },
    {
      id: 'zmeny',
      title: '9. Změny zásad',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Zásady mohu aktualizovat, například když přidám novou aplikaci nebo změním zpracovatele. Aktuální verze je vždy na této stránce; o podstatných změnách informuji registrované uživatele e-mailem.',
        },
        {
          kind: 'paragraph',
          text: `Tyto zásady jsou účinné od ${formatLegalDate(PRIVACY_POLICY_VERSION)}.`,
        },
      ],
    },
  ],
};

export const termsOfService: LegalDocument = {
  label: 'Obchodní podmínky',
  title: 'Obchodní podmínky',
  lead: `Obchodní podmínky upravují používání webu ${site.domain}, uživatelského účtu a aplikací, které na něm provozuji (nyní IziWeddy a IziBudgy). Založením účtu s nimi souhlasíte.`,
  version: TERMS_VERSION,
  sections: [
    {
      id: 'provozovatel',
      title: '1. Provozovatel a uživatel',
      blocks: [
        {
          kind: 'paragraph',
          text: `Provozovatelem je ${operator}, neplátce DPH (dále jen „provozovatel“). Kontakt: ${site.email}.`,
        },
        {
          kind: 'paragraph',
          text: 'Uživatelem je každý, kdo si na webu založí účet.',
        },
      ],
    },
    {
      id: 'sluzby',
      title: '2. Služby a cena',
      blocks: [
        {
          kind: 'list',
          items: [
            `Uživatelský účet – jeden účet pro všechny aplikace na ${site.domain}.`,
            'IziWeddy – plánovač svatby: snoubenci, hosté, přípravy a rozpočet.',
            'IziBudgy – rozpočet domácnosti: příjmy, pravidelné a jednorázové výdaje, přehled po měsících.',
          ],
        },
        {
          kind: 'paragraph',
          text: 'Všechny služby jsou nyní zdarma. Aplikace jsou ve vývoji, a proto se mohou měnit jejich funkce a vzhled. Pokud v budoucnu zavedu placené funkce, bude jejich využití vždy vyžadovat vaši samostatnou objednávku – stávající služby se bez vašeho souhlasu nezpoplatní.',
        },
      ],
    },
    {
      id: 'ucet',
      title: '3. Registrace a účet',
      blocks: [
        {
          kind: 'list',
          items: [
            'Účet si může založit fyzická osoba starší 18 let.',
            'Při registraci uvádíte jméno a e-mail; údaje musí být pravdivé. Účet aktivujete odkazem, který přijde na zadaný e-mail.',
            'Heslo se nepoužívá – přihlašujete se jednorázovým kódem zaslaným na e-mail. Za zabezpečení své e-mailové schránky odpovídáte vy; kdo má přístup ke schránce, může se přihlásit i do účtu.',
            'Účet smí používat jen jeho majitel. Podezření na zneužití mi prosím hned oznamte.',
          ],
        },
        {
          kind: 'paragraph',
          text: 'Smlouva o užívání služeb vzniká založením účtu se souhlasem s těmito podmínkami. Uzavírá se v českém jazyce na dobu neurčitou. Podmínky jsou trvale dostupné na této stránce a verzi, se kterou jste souhlasili, mám u účtu uloženou.',
        },
      ],
    },
    {
      id: 'pravidla',
      title: '4. Pravidla používání',
      blocks: [
        { kind: 'paragraph', text: 'Při používání služeb je zakázáno:' },
        {
          kind: 'list',
          items: [
            'porušovat právní předpisy nebo práva jiných osob,',
            'vkládat nezákonný, urážlivý nebo škodlivý obsah,',
            'zadávat údaje jiných osob nad rámec, který k plánování potřebujete, nebo je využívat k jinému účelu,',
            'narušovat provoz webu, obcházet zabezpečení nebo používat automatizované nástroje k hromadnému přístupu,',
            'zakládat účty jménem jiných osob.',
          ],
        },
      ],
    },
    {
      id: 'obsah',
      title: '5. Vaše údaje a obsah',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Údaje, které do aplikací zadáte, patří vám. Provozovateli udělujete oprávnění nakládat s nimi jen v rozsahu nutném k provozu služby (uložení, zobrazení, zálohování). Za zadaný obsah odpovídáte vy – zejména za to, že údaje o hostech a dalších osobách zadáváte oprávněně.',
        },
        {
          kind: 'paragraph',
          text: 'Jak s osobními údaji zacházím, popisují Zásady ochrany osobních údajů.',
        },
      ],
    },
    {
      id: 'odpovednost',
      title: '6. Dostupnost a odpovědnost',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Služby poskytuji tak, jak jsou, bez záruky nepřetržité dostupnosti – mohou nastat výpadky, údržba nebo chyby. Důležité údaje, například seznam hostů, doporučuji mít uložené i jinde.',
        },
        {
          kind: 'paragraph',
          text: 'Provozovatel neodpovídá za škodu vzniklou nedostupností služby nebo ztrátou dat v rozsahu, v jakém to právní předpisy dovolují. Tím nejsou dotčena práva spotřebitele, která nelze smluvně vyloučit, ani odpovědnost za škodu způsobenou úmyslně nebo z hrubé nedbalosti.',
        },
      ],
    },
    {
      id: 'zruseni',
      title: '7. Zrušení účtu',
      blocks: [
        {
          kind: 'list',
          items: [
            'Účet můžete kdykoli zrušit sami po přihlášení v sekci Můj účet → Smazat účet. Smazání je okamžité a nevratné: smaže se účet i plánování, která patří jen vám. Ze sdíleného plánování budete odebráni a ostatním vlastníkům zůstane.',
            `Pokud se do účtu ${INACTIVE_ACCOUNT_RETENTION_DAYS} dní nepřihlásíte, účet i s daty smažu. ${INACTIVE_ACCOUNT_WARNING_DAYS} dní předem vás upozorním e-mailem; přihlášením účet ponecháte.`,
            'Provozovatel může účet zrušit při závažném nebo opakovaném porušení těchto podmínek. Pokud by ukončil službu jako celek, upozorní vás e-mailem alespoň 30 dní předem.',
          ],
        },
      ],
    },
    {
      id: 'autorska-prava',
      title: '8. Autorská práva',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Web, aplikace, jejich vzhled, texty a zdrojový kód jsou chráněny autorským právem a patří provozovateli. Používání služeb vám nedává právo je kopírovat nebo dále šířit.',
        },
      ],
    },
    {
      id: 'zmeny',
      title: '9. Změny podmínek',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Podmínky mohu měnit, například při rozšíření služeb. O změně informuji registrované uživatele e-mailem nejméně 14 dní před její účinností. Pokud se změnou nesouhlasíte, můžete účet do té doby zrušit; pokračováním v používání po účinnosti změny s ní souhlasíte.',
        },
      ],
    },
    {
      id: 'spory',
      title: '10. Rozhodné právo a spory',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Vztahy mezi provozovatelem a uživatelem se řídí právním řádem České republiky, zejména občanským zákoníkem.',
        },
        {
          kind: 'paragraph',
          text: `Stížnosti a podněty posílejte na ${site.email}. Jste-li spotřebitel, máte právo na mimosoudní řešení sporu; příslušným subjektem je Česká obchodní inspekce, Štěpánská 796/44, 110 00 Praha 1, adr.coi.cz.`,
        },
        {
          kind: 'paragraph',
          text: `Tyto obchodní podmínky jsou účinné od ${formatLegalDate(TERMS_VERSION)}.`,
        },
      ],
    },
  ],
};
