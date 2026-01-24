// @ts-check
import { defineConfig } from 'astro/config';
import pagefind from "astro-pagefind";
import readingTime from "astro-reading-time";
import partytown from "@astrojs/partytown";
// https://astro.build/config
export default defineConfig({
    output: 'static',
    experimental: {
    preserveScriptOrder: true
    },
    integrations: [
        readingTime(), 
        pagefind(),
        partytown({
            config: {
                forward: ["dataLayer.push"],
            },
        }),
    ],
    vite: {
        build: {
            cssMinify: 'lightningcss',
            target: 'esnext',
        }
    },
});