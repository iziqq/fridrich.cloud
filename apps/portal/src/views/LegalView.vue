<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import SectionHeading from '@/components/SectionHeading.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { privacyPolicy, termsOfService } from '@/content/legal';
import { currentLocale } from '@/i18n';

const props = defineProps<{ document: 'privacy' | 'terms' }>();

const { t } = useI18n();

const doc = computed(() => (props.document === 'privacy' ? privacyPolicy : termsOfService));

/*
 * Právní dokumenty jsou jen česky – závazné znění je jedno a překlad by mohl
 * slibovat něco jiného. Přeložený je jen obal stránky; v angličtině navíc
 * upozornění, že text je česky.
 */
const czechOnly = computed(() => currentLocale.value !== 'cs');

/** Datum účinnosti podle jazyka rozhraní – česky `15. 9. 2026`, anglicky `September 15, 2026`. */
const effectiveDate = computed(() => {
  const [year, month, day] = doc.value.version.split('-').map(Number);
  return new Intl.DateTimeFormat(currentLocale.value, {
    day: 'numeric',
    month: currentLocale.value === 'cs' ? 'numeric' : 'long',
    year: 'numeric',
  }).format(new Date(year ?? 0, (month ?? 1) - 1, day ?? 1));
});

/** Druhý dokument – oba na sebe odkazují, čtenář je obvykle chce vidět spolu. */
const other = computed(() =>
  props.document === 'privacy'
    ? { to: '/obchodni-podminky', label: t('portal.legal.terms') }
    : { to: '/ochrana-osobnich-udaju', label: t('portal.legal.privacy') },
);
</script>

<template>
  <article class="page">
    <div class="container">
      <p v-if="czechOnly" class="notice glass">{{ t('portal.legal.czechOnly') }}</p>

      <SectionLabel :text="doc.label" lang="cs" />
      <SectionHeading :text="doc.title" :level="1" lang="cs" />
      <p class="mono effective">{{ t('portal.legal.effectiveFrom', { date: effectiveDate }) }}</p>
      <p class="lead" lang="cs">{{ doc.lead }}</p>

      <nav class="toc glass" :aria-label="t('portal.legal.tocLabel')">
        <p class="mono toc-title">{{ t('portal.legal.tocTitle') }}</p>
        <ol lang="cs">
          <li v-for="section in doc.sections" :key="section.id">
            <a :href="`#${section.id}`">{{ section.title }}</a>
          </li>
        </ol>
      </nav>

      <section
        v-for="section in doc.sections"
        :id="section.id"
        :key="section.id"
        class="section"
        lang="cs"
      >
        <h2>{{ section.title }}</h2>

        <template v-for="(block, index) in section.blocks" :key="index">
          <p v-if="block.kind === 'paragraph'">{{ block.text }}</p>

          <ul v-else-if="block.kind === 'list'" class="list">
            <li v-for="item in block.items" :key="item">{{ item }}</li>
          </ul>

          <!-- Na mobilu se řádky tabulky skládají pod sebe jako karty s popisky sloupců. -->
          <table v-else class="table">
            <thead>
              <tr>
                <th v-for="heading in block.head" :key="heading" scope="col">{{ heading }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in block.rows" :key="row[0]">
                <td
                  v-for="(cell, cellIndex) in row"
                  :key="cellIndex"
                  :data-label="block.head[cellIndex]"
                >
                  {{ cell }}
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </section>

      <div class="actions">
        <RouterLink :to="other.to" class="mono link">→ {{ other.label }}</RouterLink>
        <RouterLink to="/" class="mono link">{{ t('portal.legal.back') }}</RouterLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.page {
  padding-block: 10rem var(--section-gap);
}

.notice {
  max-width: 70ch;
  margin-bottom: var(--space-4);
  padding: var(--space-2) var(--space-3);
  border-color: color-mix(in srgb, var(--color-accent) 50%, transparent);
  color: var(--color-text);
}

.effective {
  margin-top: var(--space-2);
  color: var(--color-accent-soft);
}

.lead,
.section p,
.list {
  max-width: 70ch;
  color: var(--color-muted);
}

.lead {
  margin-top: var(--space-2);
}

.toc {
  margin-top: var(--space-4);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.toc-title {
  color: var(--color-accent-soft);
}

.toc ol {
  display: grid;
  gap: 0.25rem;
  margin-top: var(--space-1);
}

.toc a,
.link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-text);
  text-decoration: none;
}

.toc a:hover,
.link:hover {
  color: var(--color-accent);
}

.section {
  margin-top: var(--space-6);
  /* Kotva z obsahu nesmí skončit pod plovoucí navigací. */
  scroll-margin-top: 6rem;
}

.section h2 {
  font-size: var(--text-h3);
}

.section p,
.list {
  margin-top: var(--space-2);
}

.list {
  display: grid;
  gap: var(--space-1);
  padding-left: 1.25rem;
  list-style: disc;
}

/* --- Tabulka: mobil jako karty --- */

.table {
  display: block;
  margin-top: var(--space-3);
}

.table thead {
  display: none;
}

.table tbody,
.table tr,
.table td {
  display: block;
}

.table tr {
  margin-bottom: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.table td {
  padding-block: 0.35rem;
  color: var(--color-muted);
  /* Dlouhé odkazy na paragrafy se musí zalomit, ne vytlačit stránku do strany. */
  overflow-wrap: anywhere;
}

.table td::before {
  content: attr(data-label);
  display: block;
  color: var(--color-accent-soft);
  font-family: var(--font-mono);
  font-size: var(--text-label);
}

.table td:first-child {
  color: var(--color-text);
  font-weight: 600;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

/* --- Notebook: klasická tabulka --- */

@media (--notebook) {
  /*
   * Pevné rozvržení s danými šířkami – automatické by první sloupec s krátkými
   * názvy zúžilo tak, že by se „Kontaktní formulář" lámal po písmenech.
   */
  .table {
    display: table;
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .table th:nth-child(1) {
    width: 16%;
  }

  .table th:nth-child(2) {
    width: 26%;
  }

  .table th:nth-child(3) {
    width: 34%;
  }

  .table thead {
    display: table-header-group;
  }

  .table tbody {
    display: table-row-group;
  }

  .table tr {
    display: table-row;
    margin: 0;
    padding: 0;
    background: none;
  }

  .table th,
  .table td {
    display: table-cell;
    padding: var(--space-2);
    border: 1px solid var(--color-border);
    text-align: left;
    vertical-align: top;
    overflow-wrap: break-word;
    hyphens: auto;
  }

  .table th {
    background: var(--color-surface);
    color: var(--color-accent-soft);
    font-family: var(--font-mono);
    font-size: var(--text-label);
  }

  .table td::before {
    content: none;
  }
}
</style>
