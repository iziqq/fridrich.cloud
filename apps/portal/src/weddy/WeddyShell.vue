<script setup lang="ts">
import { RouterView } from 'vue-router';
import './weddy.css';
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
    <a class="skip-link" href="#obsah">Přeskočit na obsah</a>
    <RouterView />
  </div>
</template>
