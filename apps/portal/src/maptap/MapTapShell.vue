<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { RouterView } from 'vue-router';
import ConfirmDialog from '@/components/product/ConfirmDialog.vue';
import { useProductTheme } from '@/components/product/theme';
import './maptap.css';

const { t } = useI18n();

/* Překryvy se teleportují mimo tenhle obal – tohle jim řekne, čí je vzhled. */
useProductTheme('maptap');
</script>

<!--
  Obal tabule.

  MapTap není samostatná aplikace, jen část portálu s vlastním vzhledem.
  Třída `maptap` drží paletu, `product` společné prvky (tlačítka, karty).
-->
<template>
  <div class="maptap product">
    <!-- Obal portálu je pryč, takže si skip link drží tabule sama. -->
    <a class="skip-link" href="#obsah">{{ t('app.skipToContent') }}</a>
    <RouterView />

    <!-- Dotaz na nevratnou akci kreslíme sami; visí jednou pro celou tabuli. -->
    <ConfirmDialog />
  </div>
</template>
