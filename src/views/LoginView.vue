<template>
  <div class="min-h-screen w-full flex flex-col justify-center items-center p-6 bg-gradient-to-b from-[#1E255E] via-[#313C8E]/90 to-slate-950 text-white font-sans relative overflow-hidden" dir="rtl">
    <!-- Ambient glowing accents -->
    <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-cyan/25 blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-brand-navy/40 blur-3xl pointer-events-none"></div>

    <div class="w-full max-w-md relative z-10 flex flex-col items-center">
      <!-- Official Logo Emblem -->
      <div class="relative mb-5 flex flex-col items-center group">
        <div class="w-28 h-28 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/25 p-2.5 shadow-2xl shadow-black/40 flex items-center justify-center transition-transform duration-300 hover:scale-105">
          <img
            src="/logo.png"
            alt="شعار مركز الإشراق"
            class="w-full h-full object-contain filter drop-shadow-md"
          />
        </div>
      </div>

      <h1 class="text-2xl font-black tracking-tight text-white mb-1.5 text-center">
        مركز الإشراق
      </h1>
      <p class="text-xs font-bold text-brand-cyan mb-1 text-center tracking-wide">
        لرعاية وتأهيل ذوي الاحتياجات الخاصة
      </p>
      <p class="text-[11px] font-semibold text-slate-300/80 mb-7 text-center">
        بوابة الكوادر الطبية والإدارية والمساندة
      </p>

      <!-- Main Login Card -->
      <div class="w-full bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-2xl space-y-6">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-2">
            رمز المرور أو كود الموظف
          </label>
          <div class="relative">
            <input
              v-model="passcode"
              type="password"
              placeholder="أدخل رمز الدخول المعتمد"
              @keyup.enter="handleLogin"
              class="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-transparent text-center font-bold tracking-widest text-lg"
            />
          </div>
        </div>

        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3 pt-2">
          <button
            @click="handleLogin"
            :disabled="isLoading || !passcode"
            class="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-navyDark hover:from-blue-800 hover:to-slate-900 border border-brand-cyan/40 text-white font-extrabold text-sm shadow-xl shadow-brand-blue/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer touch-target-48 active:scale-[0.99]"
          >
            <span v-if="isLoading" class="animate-spin text-lg">◌</span>
            <span v-else>تسجيل الدخول</span>
          </button>

          <!-- Quick Biometric Fingerprint / FaceID Login Button -->
          <button
            type="button"
            @click="handleBiometricLogin"
            class="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer touch-target-48"
          >
            <Fingerprint class="w-5 h-5 text-brand-cyan" />
            <span>الدخول السريع بالبصمة الحيوية (Biometric)</span>
          </button>
        </div>
      </div>

      <!-- Footer Info -->
      <p class="text-xs text-slate-400/70 mt-8 text-center font-medium">
        منظومة رعاية وتأهيل الأطفال — إصدار الكوادر v3.0
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { Fingerprint, AlertCircle } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const passcode = ref('');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

async function handleLogin() {
  if (!passcode.value) return;
  isLoading.value = true;
  errorMessage.value = null;

  const res = await authStore.login(passcode.value);
  isLoading.value = false;

  if (res.success) {
    if (res.role === 'ADMIN') router.push('/admin/dashboard');
    else if (res.role === 'SUPPORT_WORKER') router.push('/worker/dashboard');
    else router.push('/specialist/dashboard');
  } else {
    errorMessage.value = res.message || 'رمز المرور غير صحيح';
  }
}

async function handleBiometricLogin() {
  errorMessage.value = null;
  const res = await authStore.biometricLogin();
  if (res.success) {
    if (res.role === 'ADMIN') router.push('/admin/dashboard');
    else if (res.role === 'SUPPORT_WORKER') router.push('/worker/dashboard');
    else router.push('/specialist/dashboard');
  } else {
    errorMessage.value = res.message;
  }
}
</script>
