<template>
  <footer class="site-footer">
    页脚
  </footer>
</template>

<script lang="ts">
// 页脚组件逻辑
</script>

<style scoped>
.site-footer {
  width: 100%;
  padding: 1rem 0;
  text-align: center;
  margin-top: auto;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  background-color: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

@media (max-width: 768px) {
  .site-footer {
    padding: 0.8rem 0;
    font-size: 0.8rem;
  }
}
</style>