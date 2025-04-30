<template>
    <nav class="nav">
        <button class="mobile-menu-toggle" @click="toggleMenu" aria-label="导航菜单">
            <i class="menu-icon"></i>
        </button>
        <ul :class="{ 'active': isMenuOpen }">
            <li v-for="item in navItems" :key="item.path">
                <a :href="item.path">{{ item.title }}</a>
            </li>
        </ul>
    </nav>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { site } from '../consts';
import { config_site } from '../_config';

const navItems = computed(() => {
    return config_site.nav || site.nav || [];
});

const siteTitle = computed(() => {
    return config_site.title || site.title || 'Blog';
});

const isMenuOpen = ref(false);

function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
}
</script>

<style scoped>
.nav {
    width: 100%;
    max-width: 960px;
    margin: 20px auto;
    padding: 10px 0;
    position: relative;
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

.mobile-menu-toggle {
    display: none;
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    position: absolute;
    top: 10px;
    right: 15px;
    z-index: 100;
}

.menu-icon {
    display: block;
    width: 25px;
    height: 3px;
    background-color: white;
    position: relative;
    transition: all 0.3s ease-in-out;
}

.menu-icon::before, .menu-icon::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: white;
    transition: all 0.3s ease-in-out;
}

.menu-icon::before {
    transform: translateY(-8px);
}

.menu-icon::after {
    transform: translateY(8px);
}

@media (max-width: 768px) {
    .nav {
        width: 100%;
        margin: 10px auto;
    }
    
    .mobile-menu-toggle {
        display: block;
    }
    
    .nav ul {
        display: none;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background-color: rgba(32, 32, 32, 0.95);
        padding: 20px 0;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 99;
    }
    
    .nav ul.active {
        display: flex;
    }
    
    .nav li {
        margin: 10px 0;
        text-align: center;
    }
    
    .nav a {
        display: block;
        padding: 12px 0;
        font-size: 1.1rem;
    }
}

@media (max-width: 480px) {
    .nav a {
        font-size: 1rem;
    }
}
</style>