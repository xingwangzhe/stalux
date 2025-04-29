<template>
  <div class="card">
    <div class="auther">
      <img class="avatar" :src="avatarPath" :alt="author + ' avatar'" />
      <div class="name"><h2>{{ author }}</h2></div>
      <slot name="social-links"></slot>
    </div>
  </div>
</template>

<script>
import { site } from '../../consts';
import { config_site } from '../../_config';

export default {
  name: 'AuthorCard',
  props: {
    avatarPath: {
      type: String,
      default: '/avatar.jpg'
    },
    author: {
      type: String,
      default() {
        return config_site.author || site.author || 'Author';
      }
    }
  }
}
</script>

<style scoped>
.card {
  width: 60%;
  height: 33%;
  margin: 50px auto;  
  background-color: rgba(0, 0, 0, 0.021); 
  backdrop-filter: blur(25px); 
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3); 
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.226); 
}

.auther {
  display: flex;
  align-items: center;
  padding: 2px;
}

.name {
  font-size: 1.5rem;
  margin-left: 5px;
  text-shadow: 0.25rem 0.25rem 0.5rem rgb(1, 162, 190);    
}

.avatar {
  border-radius: 50%;
  overflow: hidden;
  margin-left: 5px;
  display: block;
  width: 100px;
  height: 100px;
  border: 2px solid aqua;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  object-fit: cover;
}
</style>