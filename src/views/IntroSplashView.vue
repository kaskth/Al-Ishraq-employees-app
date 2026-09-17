<template>
  <div class="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 overflow-hidden select-none bg-gradient-to-b from-[#060919] via-[#0D1333] to-[#151D48] text-white font-sans text-right" dir="rtl">
    <!-- Ambient Lighting Effects -->
    <div class="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none animate-pulse"></div>
    <div class="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none animate-pulse" style="animation-duration: 4s;"></div>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(49,60,142,0.18)_0%,transparent_70%)] pointer-events-none"></div>

    <!-- Top Bar: Affiliation Badge & Skip Button -->
    <div class="w-full max-w-md flex items-center justify-between pt-4 relative z-20">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-bold text-amber-300 shadow-sm">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
        <span>دار القوات الجوية</span>
      </div>

      <button
        @click="finishIntro"
        class="inline-flex items-center gap-1 px-3.5 py-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
      >
        <span>تخطي</span>
        <ChevronLeft class="w-3.5 h-3.5 rtl-mirror" />
      </button>
    </div>

    <!-- Center Showcase: Logo, Glow & Center Title -->
    <div class="w-full max-w-sm flex flex-col items-center justify-center text-center space-y-6 relative z-10 my-auto">
      <!-- Animated Glowing Emblem -->
      <div class="relative group">
        <div class="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-400 via-indigo-500 to-sky-400 opacity-60 blur-lg animate-pulse"></div>
        <div class="relative w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-white/95 p-3.5 shadow-2xl flex items-center justify-center border-2 border-amber-300/40 transform transition-all duration-700 hover:scale-105">
          <img
            src="/logo.png"
            alt="مركز الإشراق"
            class="w-full h-full object-contain filter drop-shadow-md transition-transform duration-500"
          />
        </div>
      </div>

      <!-- Identity & Branding Titles -->
      <div class="space-y-2">
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
          مركز الإشراق الطبي
        </h1>
        <p class="text-xs sm:text-sm font-bold text-amber-300 tracking-wide">
          لرعاية وتأهيل ذوي الاحتياجات الخاصة
        </p>
        <p class="text-[11px] text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
          إدارة نوادي وفنادق القوات الجوية • منظومة الدوام والتقييم الإكلينيكي الذكي
        </p>
      </div>
    </div>

    <!-- Bottom Section: Loading Engine, Ticker & Progress Bar -->
    <div class="w-full max-w-md space-y-4 pb-6 relative z-20">
      <!-- Dynamic Step Ticker with Fade Animation -->
      <div class="flex items-center justify-between px-1 text-xs">
        <div class="flex items-center gap-2 text-slate-300 font-bold min-h-[22px]">
          <span class="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          <transition name="fade" mode="out-in">
            <span :key="currentStepIndex" class="text-[11px] sm:text-xs">
              {{ currentStepMessage }}
            </span>
          </transition>
        </div>
        <span class="font-mono font-black text-amber-400 text-xs">{{ progressPercent }}%</span>
      </div>

      <!-- High-End Progress Bar -->
      <div class="w-full h-2 rounded-full bg-white/10 backdrop-blur-md overflow-hidden p-0.5 border border-white/10 shadow-inner">
        <div
          class="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-amber-400 transition-all duration-150 ease-out shadow-[0_0_12px_rgba(56,189,248,0.6)]"
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>

      <!-- System Security Badges -->
      <div class="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-semibold pt-1">
        <span class="flex items-center gap-1">
          <ShieldCheck class="w-3.5 h-3.5 text-emerald-400" />
          <span>تشفير حيوي 256-bit</span>
        </span>
        <span>•</span>
        <span class="flex items-center gap-1">
          <CheckCircle2 class="w-3.5 h-3.5 text-sky-400" />
          <span>معايير إكلينيكية معتمدة</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { ChevronLeft, ShieldCheck, CheckCircle2 } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const progressPercent = ref(0);
let timer: any = null;

const steps = [
  { at: 0, text: 'تهيئة النواة وتأمين جلسة العمل المشفرة...' },
  { at: 25, text: 'التحقق من البصمة الحيوية وخدمات الموقع الجغرافي...' },
  { at: 55, text: 'مزامنة الجداول اليومية والمقاييس الإكلينيكية...' },
  { at: 85, text: 'جاهز للانطلاق • مرحباً بكم في إشراق' },
];

const currentStepIndex = computed(() => {
  if (progressPercent.value >= 85) return 3;
  if (progressPercent.value >= 55) return 2;
  if (progressPercent.value >= 25) return 1;
  return 0;
});

const currentStepMessage = computed(() => steps[currentStepIndex.value].text);

onMounted(() => {
  // 5.5 seconds animation duration (55ms * 100 steps)
  timer = setInterval(() => {
    if (progressPercent.value < 100) {
      progressPercent.value += 1;
    } else {
      clearInterval(timer);
      setTimeout(() => {
        finishIntro();
      }, 400);
    }
  }, 55);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

function finishIntro() {
  if (timer) clearInterval(timer);
  sessionStorage.setItem('hasSeenSplash', 'true');
  // Route to dashboard if authenticated, or login if not
  if (authStore.isAuthenticated) {
    if (authStore.isAdmin) router.replace('/admin/dashboard');
    else if (authStore.isWorker) router.replace('/worker/dashboard');
    else router.replace('/specialist/dashboard');
  } else {
    router.replace('/login');
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(3px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}

.rtl-mirror {
  transform: scaleX(-1);
}
</style>
