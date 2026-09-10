<script setup lang="ts">
import { RouterLink } from 'vue-router';
import GlitchHeading from '@/components/GlitchHeading.vue';
import SectionLabel from '@/components/SectionLabel.vue';
</script>

<template>
  <section class="page">
    <div class="container">
      <SectionLabel text="// Přihlášení" />
      <GlitchHeading text="Přihlásit se" :level="1" />

      <!--
        Formulář zatím není napojený – identita se staví v dalším kroku
        (doc/architecture.md, kap. 5). Než bude modul `identity` hotový,
        nemá smysl tvářit se, že přihlášení funguje.
      -->
      <div class="notice bevel">
        <p class="mono heading">// Připravujeme</p>
        <p>
          Účty na fridrich.cloud teprve stavím. Až budou hotové, přihlásíte se tady
          jedním účtem do všech aplikací – IziWeddy i IziBudgy.
        </p>
        <p>
          Zatím mě zastihnete přes <RouterLink to="/#kontakt">kontaktní formulář</RouterLink>.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page {
  padding-block: 10rem var(--section-gap);
}

.notice {
  max-width: 34rem;
  margin-top: var(--space-4);
  padding: var(--space-3);
  border: 1px solid var(--cp-line);
  background: var(--cp-panel);
}

.heading {
  margin-bottom: var(--space-1);
  color: var(--cp-yellow);
}

.notice p + p {
  margin-top: var(--space-2);
  color: var(--cp-muted);
}
</style>
