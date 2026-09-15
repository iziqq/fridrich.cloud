import { fileURLToPath } from 'node:url';
import postcssGlobalData from '@csstools/postcss-global-data';
import postcssCustomMedia from 'postcss-custom-media';

// Breakpointy (`@media (--tablet)`) jsou definované jednou v design balíčku.
// Global data je vloží do každého CSS i `<style>` bloku komponenty, custom media
// je přeloží na obyčejné `min-width` a definice z výstupu zase odstraní.
export default {
  plugins: [
    postcssGlobalData({
      files: [fileURLToPath(new URL('../../packages/design/src/breakpoints.css', import.meta.url))],
    }),
    postcssCustomMedia(),
  ],
};
