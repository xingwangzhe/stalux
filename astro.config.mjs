// @ts-check
import { defineConfig } from 'astro/config';
import pagefind from "astro-pagefind";
// https://astro.build/config
export default defineConfig({
    output: 'static',
    integrations: [pagefind()],
    vite: {
        css: {
        transformer: "lightningcss",
        },
  },
});