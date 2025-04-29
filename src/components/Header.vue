<template>
    <nav class="nav">
        <ul>
            <li v-for="item in navItems" :key="item.path">
                <a :href="item.path">{{ item.title }}</a>
            </li>
        </ul>
    </nav>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { site } from '../consts';
import { config_site } from '../_config';

const navItems = computed(() => {
    return config_site.nav || site.nav || [];
});

const siteTitle = computed(() => {
    return config_site.title || site.title || 'Blog';
});
</script>

<style scoped>
.nav {
    width: 60%;
    margin: 20px auto;
    padding: 10px 0;
}

.nav ul {
    display: flex;
    justify-content: center;
    list-style: none;
    padding: 0;
    margin: 0;
}

.nav li {
    margin: 0 15px;
}

.nav a {
    text-decoration: none;
    font-size: 1.2rem;
    color: inherit;
    padding: 8px 15px;
    transition: all 0.3s ease;
    text-shadow: 0.1rem 0.1rem 0.2rem rgb(1, 162, 190);
}

.nav a:hover {
    transform: translateY(-3px);
}
</style>