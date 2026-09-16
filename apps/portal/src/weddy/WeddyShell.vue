<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { RouterView } from 'vue-router';
import ConfirmDialog from './components/ConfirmDialog.vue';
import './weddy.css';

const { t } = useI18n();
</script>

<!--
  Obal svatebního plánovače.

  IziWeddy není samostatná aplikace, jen část portálu s vlastním vzhledem.
  Třída `weddy` je jediné, co ten vzhled drží: `weddy.css` na ní předefinuje
  designové tokeny, takže cyberpunkové barvy portálu sem neprosáknou a naopak.
-->
<template>
  <div class="weddy">
    <!-- Obal portálu je pryč, takže si skip link drží plánovač sám. -->
    <a class="skip-link" href="#obsah">{{ t('app.skipToContent') }}</a>
    <RouterView />

    <!-- Dotaz na nevratnou akci kreslíme sami; visí jednou pro celý plánovač. -->
    <ConfirmDialog />
  </div>
</template>
