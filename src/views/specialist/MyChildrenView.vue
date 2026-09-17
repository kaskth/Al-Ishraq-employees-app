<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-black text-slate-900">أطفالي وحالات التأهيل</h2>
        <p class="text-xs font-semibold text-slate-400">
          الأطفال المسندون إليك حصرياً وفق جدول الجلسات المعتمد
        </p>
      </div>
      <span class="px-3 py-1 rounded-xl bg-blue-50 text-brand-blue text-xs font-black border border-blue-100">
        {{ therapyStore.myChildren.length }} أطفال
      </span>
    </div>

    <!-- Search Input -->
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="ابحث باسم الطفل أو فئة التشخيص..."
        class="w-full py-3 px-4 rounded-2xl bg-white border border-slate-200/80 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
      />
    </div>

    <!-- Loading Skeleton -->
    <div v-if="therapyStore.isLoading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-24 rounded-2xl bg-slate-200/60 animate-pulse"></div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredChildren.length === 0"
      class="p-8 text-center rounded-3xl bg-white border border-slate-200/80 space-y-2"
    >
      <p class="text-sm font-bold text-slate-700">لا يوجد أطفال مسجلون</p>
      <p class="text-xs text-slate-400">لم يتم العثور على أطفال مسندين لجداولك العلاجية حالياً</p>
    </div>

    <!-- Children Cards Grid (Responsive Tablet 2-columns) -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      <div
        v-for="child in filteredChildren"
        :key="child.id"
        @click="$router.push(`/specialist/children/${child.id}`)"
        class="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-brand-blue/30 transition-all cursor-pointer flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-lg overflow-hidden flex-shrink-0">
            <img
              v-if="child.formalPersonalPhoto"
              :src="getPhotoUrl(child.formalPersonalPhoto)"
              alt="Child"
              class="w-full h-full object-cover"
            />
            <span v-else>{{ child.name[0] }}</span>
          </div>

          <div class="min-w-0">
            <h3 class="text-sm font-black text-slate-900 truncate">
              {{ child.name }}
            </h3>
            <p class="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
              {{ child.category }} • {{ child.section }}
            </p>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                {{ child.age ? child.age + ' سنوات' : 'السن غير مسجل' }}
              </span>
              <span v-if="child.nextAssessmentDate" class="text-[10px] text-amber-600 font-bold">
                التقييم: {{ formatDate(child.nextAssessmentDate) }}
              </span>
            </div>
          </div>
        </div>

        <button
          class="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-brand-blue hover:bg-blue-50 transition-colors flex-shrink-0"
        >
          <ChevronLeft class="w-5 h-5 rtl-mirror" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTherapyStore } from '../../stores/therapy.store';
import { ChevronLeft } from 'lucide-vue-next';

const therapyStore = useTherapyStore();
const searchQuery = ref('');

onMounted(() => {
  therapyStore.fetchMyChildren();
});

const filteredChildren = computed(() => {
  if (!searchQuery.value.trim()) return therapyStore.myChildren;
  const q = searchQuery.value.toLowerCase();
  return therapyStore.myChildren.filter(
    c => c.name.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q) || c.section?.toLowerCase().includes(q)
  );
});

function getPhotoUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `http://localhost:3010/${path.replace(/^\/+/, '')}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' });
}
</script>
