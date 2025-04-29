<template>
    <div class="title"><h1>{{ siteTitle }}</h1></div>
    <nav class="nav">
        <ul>
            <li v-for="item in navItems" :key="item.path">
                <a :href="item.path">{{ item.title }}</a>
            </li>
        </ul>
    </nav>
</template>

<script>
import { site } from '../consts';
import { config_site } from '../_config';

export default {
    name: 'Header',
    computed: {
        navItems() {
            return config_site.nav || site.nav || [];
        },
        siteTitle() {
            return config_site.title || site.title || 'Blog';
        }
    }
}
</script>

<style scoped>
.title {
    font-size: 2.0rem;
    display: flex;
    justify-content: center;
    text-shadow: 0.25rem 0.25rem 0.5rem rgb(1, 162, 190);
}

.nav {
    width: 60%;
    margin: 20px auto;
    background-color: rgba(0, 0, 0, 0.021);
    backdrop-filter: blur(25px);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 10px 35px rgba(0, 0, 0, 0.226);
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
    border-radius: 5px;
    transition: all 0.3s ease;
    text-shadow: 0.1rem 0.1rem 0.2rem rgb(1, 162, 190);
}

.nav a:hover {
    background-color: rgba(0, 255, 255, 0.2);
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 255, 255, 0.3);
}
</style>