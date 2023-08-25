<script setup lang="ts">
import MatchSlider from './components/MatchSlider.vue'
import Refresh from './components/Refresh.vue'
</script>

<template>
  <main>
    <header>
      <h2 class="name"><b>Faceit-Enhancer-Enhancer</b></h2>
    </header>
    <MatchSlider />
    <Refresh />
  </main>
</template>

<style scoped>
.name{
  white-space: nowrap;
}
main{
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
</style>
