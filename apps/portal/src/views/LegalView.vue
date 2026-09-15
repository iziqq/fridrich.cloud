<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import GlitchHeading from '@/components/GlitchHeading.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { formatLegalDate, privacyPolicy, termsOfService } from '@/content/legal';

const props = defineProps<{ document: 'privacy' | 'terms' }>();

const doc = computed(() => (props.document === 'privacy' ? privacyPolicy : termsOfService));

/** Druhý dokument – oba na sebe odkazují, čtenář je obvykle chce vidět spolu. */
const other = computed(() =>
  props.document === 'privacy'
    ? { to: '/obchodni-podminky', label: 'Obchodní podmínky' }
    : { to: '/ochrana-osobnich-udaju', label: 'Zásady ochrany osobních údajů' },
);
</script>

<template>
  <article class="page">
    <div class="container">
      <SectionLabel :text="doc.label" />
      <GlitchHeading :text="doc.title" :level="1" />
      <p class="mono effective">Účinné od {{ formatLegalDate(doc.version) }}</p>
      <p class="lead">{{ doc.lead }}</p>

      <nav class="toc bevel-sm" aria-label="Obsah dokumentu">
        <p class="mono toc-title">// Obsah</p>
        <ol>
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
        <RouterLink to="/" class="mono link">← Zpět na web</RouterLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.page {
  padding-block: 10rem var(--section-gap);
}

.effective {
  margin-top: var(--space-2);
  color: var(--cp-cyan);
}

.lead,
.section p,
.list {
  max-width: 70ch;
  color: var(--cp-muted);
}

.lead {
  margin-top: var(--space-2);
}

.toc {
  margin-top: var(--space-4);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--cp-line);
  background: var(--cp-panel);
}

.toc-title {
  color: var(--cp-cyan);
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
  color: var(--cp-text);
  text-decoration: none;
}

.toc a:hover,
.link:hover {
  color: var(--cp-yellow);
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
  list-style: square;
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
  border: 1px solid var(--cp-line);
  background: var(--cp-panel);
}

.table td {
  padding-block: 0.35rem;
  color: var(--cp-muted);
  /* Dlouhé odkazy na paragrafy se musí zalomit, ne vytlačit stránku do strany. */
  overflow-wrap: anywhere;
}

.table td::before {
  content: attr(data-label);
  display: block;
  color: var(--cp-cyan);
  font-family: var(--font-mono);
  font-size: var(--text-label);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.table td:first-child {
  color: var(--cp-text);
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
    border: 1px solid var(--cp-line);
    text-align: left;
    vertical-align: top;
    overflow-wrap: break-word;
    hyphens: auto;
  }

  .table th {
    background: var(--cp-panel);
    color: var(--cp-cyan);
    font-family: var(--font-mono);
    font-size: var(--text-label);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .table td::before {
    content: none;
  }
}
</style>
