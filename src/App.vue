<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useTherapyStore } from './stores/therapy.store';
import { updaterService } from './services/updater.service';

const therapyStore = useTherapyStore();

onMounted(() => {
  therapyStore.initOfflineQueue();
  updaterService.init();
});
</script>
