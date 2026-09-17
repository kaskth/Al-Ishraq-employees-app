<template>
  <div class="min-h-screen w-full flex flex-col justify-center items-center p-6 bg-gradient-to-b from-[#1E255E] via-[#313C8E]/90 to-slate-950 text-white font-sans relative overflow-hidden" dir="rtl">
    <!-- Ambient glowing accents -->
    <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-cyan/25 blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-brand-navy/40 blur-3xl pointer-events-none"></div>

    <div class="w-full max-w-md relative z-10 flex flex-col items-center">
      <!-- Official Logo Emblem -->
      <div class="relative mb-4 flex flex-col items-center group">
        <div class="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/25 p-2 shadow-2xl shadow-black/40 flex items-center justify-center transition-transform duration-300 hover:scale-105">
          <img
            src="/logo.png"
            alt="شعار مركز الإشراق"
            class="w-full h-full object-contain filter drop-shadow-md"
          />
        </div>
      </div>

      <h1 class="text-2xl font-black tracking-tight text-white mb-1 text-center">
        مركز الإشراق الطبي
      </h1>
      <p class="text-xs font-bold text-brand-cyan mb-1 text-center tracking-wide">
        لرعاية وتأهيل ذوي الاحتياجات الخاصة
      </p>
      <p class="text-[11px] font-semibold text-slate-300/80 mb-6 text-center">
        بوابة الكوادر الطبية والإدارية والمساندة
      </p>

      <!-- Main Login Card -->
      <div class="w-full bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
        <!-- Field 1: Employee ID -->
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <User class="w-3.5 h-3.5 text-brand-cyan" />
            <span>كود أو رقم الموظف (ID)</span>
          </label>
          <div class="relative">
            <input
              v-model="employeeId"
              type="text"
              inputmode="numeric"
              placeholder="أدخل كود الموظف (مثال: 26)"
              @keyup.enter="focusPasswordOrLogin"
              ref="employeeIdInput"
              class="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-transparent font-bold text-base"
            />
          </div>
        </div>

        <!-- Field 2: Password -->
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <Lock class="w-3.5 h-3.5 text-amber-400" />
              <span>كلمة المرور (PIN)</span>
            </span>
            <span class="text-[10px] text-amber-300/90 font-medium">الافتراضي: 12345678</span>
          </label>
          <div class="relative flex items-center">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="أدخل كلمة المرور"
              @keyup.enter="handleLogin"
              ref="passwordInput"
              class="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-transparent font-bold text-base tracking-wider"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute left-3 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Helper hint -->
        <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 flex items-start gap-2">
          <Info class="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
          <span>كلمة المرور الافتراضية لجميع الموظفين هي <strong class="text-amber-300 font-mono">12345678</strong>، ويمكنك تغييرها بأمان بعد الدخول من صفحة الملف الشخصي.</span>
        </div>

        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-2.5 pt-1">
          <button
            @click="handleLogin"
            :disabled="isLoading || !employeeId || !password"
            class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-navyDark hover:from-blue-800 hover:to-slate-900 border border-brand-cyan/40 text-white font-extrabold text-sm shadow-xl shadow-brand-blue/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer touch-target-48 active:scale-[0.99]"
          >
            <span v-if="isLoading" class="animate-spin text-lg">◌</span>
            <span v-else>تسجيل الدخول</span>
          </button>

          <!-- Quick Biometric Fingerprint / FaceID Login Button -->
          <button
            type="button"
            @click="handleBiometricLogin"
            class="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer touch-target-48"
          >
            <Fingerprint class="w-4 h-4 text-brand-cyan" />
            <span>الدخول السريع بالبصمة الحيوية (Biometric)</span>
          </button>
        </div>
      </div>

      <!-- Footer Info -->
      <p class="text-xs text-slate-400/70 mt-6 text-center font-medium">
        منظومة رعاية وتأهيل الأطفال — إصدار الكوادر v3.0
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { Fingerprint, AlertCircle, User, Lock, Eye, EyeOff, Info } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const employeeId = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const employeeIdInput = ref<HTMLInputElement | null>(null);
const passwordInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
  const cachedId = localStorage.getItem('saved_employee_id');
  if (cachedId) {
    employeeId.value = cachedId;
  }
});

function focusPasswordOrLogin() {
  if (password.value) {
    handleLogin();
  } else if (passwordInput.value) {
    passwordInput.value.focus();
  }
}

async function handleLogin() {
  if (!employeeId.value || !password.value) return;
  isLoading.value = true;
  errorMessage.value = null;

  const res = await authStore.login(employeeId.value.trim(), password.value.trim());
  isLoading.value = false;

  if (res.success) {
    if (res.role === 'ADMIN') router.push('/admin/dashboard');
    else if (res.role === 'SUPPORT_WORKER') router.push('/worker/dashboard');
    else router.push('/specialist/dashboard');
  } else {
    errorMessage.value = res.message || 'بيانات الدخول غير صحيحة';
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
