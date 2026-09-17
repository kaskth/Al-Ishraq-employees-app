<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useTherapyStore } from './stores/therapy.store';

const therapyStore = useTherapyStore();

onMounted(() => {
  therapyStore.initOfflineQueue();
});
</script>
