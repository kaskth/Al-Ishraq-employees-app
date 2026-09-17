<template>
  <div class="h-screen w-screen flex flex-col bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans select-none" dir="rtl">
    <!-- Top Header -->
    <header class="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 flex items-center justify-between flex-shrink-0 z-30 safe-area-top shadow-xs">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shadow-xs flex-shrink-0">
          <img
            src="/logo.png"
            alt="شعار مركز الإشراق"
            class="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 class="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>مركز الإشراق</span>
            <span
              class="text-[10px] px-2 py-0.5 rounded-full font-bold"
              :class="roleBadgeClass"
            >
              {{ roleLabel }}
            </span>
          </h1>
          <p class="text-[11px] font-semibold text-slate-400 truncate max-w-[180px]">
            {{ authStore.user?.name || 'مرحباً بك' }}
          </p>
        </div>
      </div>

      <!-- Left Action Badges -->
      <div class="flex items-center gap-2">
        <!-- Online/Offline Indicator Pill -->
        <div
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors"
          :class="isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'"
        >
          <span class="w-2 h-2 rounded-full" :class="isOnline ? 'bg-emerald-500' : 'bg-rose-500'"></span>
          <span>{{ isOnline ? 'متصل' : 'أوفلاين' }}</span>
        </div>

        <!-- Logout / Exit -->
        <button
          @click="handleLogout"
          class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
          title="تسجيل الخروج"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Main View Area (Responsive & Tablet Split Ready) -->
    <main class="flex-1 overflow-y-auto no-scrollbar relative p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
      <router-view />
    </main>

    <!-- Role-Adaptive Dynamic Bottom Navigation Bar (Thumb-Friendly 48px+) -->
    <nav class="bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around flex-shrink-0 z-30 safe-area-bottom shadow-lg">
      <router-link
        v-for="item in currentNavItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 touch-target-48 min-w-[64px]"
        :class="route.path === item.to ? 'text-brand-blue font-bold' : 'text-slate-400 hover:text-slate-600'"
      >
        <div
          class="p-1 rounded-xl transition-all"
          :class="route.path === item.to ? 'bg-blue-50 text-brand-blue scale-110' : ''"
        >
          <component :is="item.icon" class="w-5 h-5" />
        </div>
        <span class="text-[10px] mt-0.5 tracking-tight">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import {
  Calendar,
  Users,
  Clock,
  User,
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  FileCheck,
  LogOut,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const isOnline = ref(navigator.onLine);

onMounted(() => {
  window.addEventListener('online', () => (isOnline.value = true));
  window.addEventListener('offline', () => (isOnline.value = false));
});

const roleLabel = computed(() => {
  if (authStore.isSpecialist) return 'أخصائي تأهيل';
  if (authStore.isAdmin) return 'إدارة المركز';
  if (authStore.isWorker) return 'خدمات مساندة';
  return 'كادر المركز';
});

const roleBadgeClass = computed(() => {
  if (authStore.isSpecialist) return 'bg-brand-ice text-brand-navy border border-brand-cyan/40';
  if (authStore.isAdmin) return 'bg-amber-50 text-amber-800 border border-amber-200';
  return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
});

const currentNavItems = computed(() => {
  if (authStore.isSpecialist) {
    return [
      { label: 'الرئيسية', to: '/specialist/dashboard', icon: Calendar },
      { label: 'أطفالي', to: '/specialist/my-children', icon: Users },
      { label: 'الدوام', to: '/specialist/attendance', icon: Clock },
      { label: 'حسابي', to: '/specialist/profile', icon: User },
    ];
  }

  if (authStore.isAdmin) {
    return [
      { label: 'اللوحة', to: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'الاعتمادات', to: '/admin/approvals', icon: FileCheck },
      { label: 'الدوام', to: '/admin/attendance', icon: Clock },
      { label: 'حسابي', to: '/admin/profile', icon: User },
    ];
  }

  // Support Worker
  return [
    { label: 'الحضور', to: '/worker/dashboard', icon: CheckSquare },
    { label: 'مهامي', to: '/worker/dashboard', icon: ListTodo },
    { label: 'إجازاتي', to: '/worker/leaves', icon: User },
  ];
});

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>
