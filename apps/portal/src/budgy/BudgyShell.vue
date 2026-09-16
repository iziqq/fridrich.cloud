<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { RouterView } from 'vue-router';
import ConfirmDialog from '@/components/product/ConfirmDialog.vue';
import { useProductTheme } from '@/components/product/theme';
import './budgy.css';

const { t } = useI18n();

/* Překryvy se teleportují mimo tenhle obal – tohle jim řekne, čí je vzhled. */
useProductTheme('budgy');
</script>

<!--
  Obal rozpočtu.

  IziBudgy není samostatná aplikace, jen část portálu s vlastním vzhledem.
  Třída `budgy` drží paletu, `product` společné prvky (tlačítka, karty).
-->
<template>
  <div class="budgy product">
    <!-- Obal portálu je pryč, takže si skip link drží rozpočet sám. -->
    <a class="skip-link" href="#obsah">{{ t('app.skipToContent') }}</a>
    <RouterView />

    <!-- Dotaz na nevratnou akci kreslíme sami; visí jednou pro celý rozpočet. -->
    <ConfirmDialog />
  </div>
</template>
