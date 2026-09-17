import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '../api/client';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { showErrorNotification, showSuccessNotification } from '../utils/errorHandler';

export interface MobileUser {
  id: number;
  name: string;
  role: 'SPECIALIST' | 'ADMIN' | 'SUPPORT_WORKER';
  category: string;
  section: string;
  specialization?: string;
  jobTitle?: string;
  formalPersonalPhoto?: string;
  workingPeriod?: string;
  phoneNumber?: string;
  address?: string;
  email?: string;
  deviceUuid?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('mobile_auth_token'));
  const user = ref<MobileUser | null>(
    localStorage.getItem('mobile_user_profile')
      ? JSON.parse(localStorage.getItem('mobile_user_profile')!)
      : null
  );
  const isLoading = ref(false);
  const errorMessage = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const role = computed<'SPECIALIST' | 'ADMIN' | 'SUPPORT_WORKER'>(() => user.value?.role || 'SPECIALIST');
  const isSpecialist = computed(() => role.value === 'SPECIALIST');
  const isAdmin = computed(() => role.value === 'ADMIN');
  const isWorker = computed(() => role.value === 'SUPPORT_WORKER');

  function getOrGenerateDeviceUuid(): string {
    let uuid = localStorage.getItem('mobile_device_uuid');
    if (!uuid) {
      uuid = 'DEV-' + Math.random().toString(36).substring(2, 11).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
      localStorage.setItem('mobile_device_uuid', uuid);
    }
    return uuid;
  }

  async function login(passcode: string) {
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const deviceUuid = getOrGenerateDeviceUuid();
      const res = await apiClient.post('/auth/login', {
        passcode,
        deviceUuid,
        deviceModel: navigator.userAgent,
      });

      if (res.data.status && res.data.data) {
        token.value = res.data.data.token;
        user.value = res.data.data.user;

        localStorage.setItem('mobile_auth_token', token.value!);
        localStorage.setItem('mobile_user_profile', JSON.stringify(user.value));
        localStorage.setItem('saved_passcode_cached', passcode);

        try {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (e) {}

        showSuccessNotification(`مرحباً بك ${user.value?.name || ''}`);
        return { success: true, role: user.value?.role };
      }
      throw new Error(res.data.message || 'فشل تسجيل الدخول');
    } catch (err: any) {
      showErrorNotification(err, 'فشل تسجيل الدخول');
      errorMessage.value = err.response?.data?.message || err.message;
      return { success: false, message: errorMessage.value };
    } finally {
      isLoading.value = false;
    }
  }

  async function biometricLogin() {
    try {
      const isAvailable = await NativeBiometric.isAvailable();
      if (!isAvailable.isAvailable) {
        return { success: false, message: 'البصمة الحيوية غير متاحة على هذا الجهاز' };
      }

      await NativeBiometric.verifyIdentity({
        reason: 'إثبات الهوية للوصول إلى تطبيق كوادر إشراق',
        title: 'البصمة الحيوية',
        subtitle: 'المس المستشعر للمتابعة',
        description: 'تسجيل دخول سريع لمركز الإشراق الطبي',
      });

      const savedPasscode = localStorage.getItem('saved_passcode_cached');
      if (savedPasscode) {
        return await login(savedPasscode);
      } else {
        return { success: false, message: 'يرجى تسجيل الدخول برمز المرور أولاً لربط البصمة الحيوية' };
      }
    } catch (e: any) {
      return { success: false, message: 'تم إلغاء المصادقة أو عدم تطابق البصمة' };
    }
  }

  async function fetchMe() {
    if (!token.value) return;
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data.status && res.data.data) {
        user.value = { ...user.value, ...res.data.data };
        localStorage.setItem('mobile_user_profile', JSON.stringify(user.value));
      }
    } catch (e) {
      console.warn('Failed to refresh profile:', e);
    }
  }

  async function updateProfile(payload: { phoneNumber?: string; address?: string; email?: string }) {
    try {
      const res = await apiClient.patch('/auth/profile', payload);
      if (res.data.status && res.data.data) {
        user.value = { ...user.value, ...res.data.data };
        localStorage.setItem('mobile_user_profile', JSON.stringify(user.value));
        showSuccessNotification(res.data.message || 'تم تحديث الملف الشخصي بنجاح');
        return true;
      }
      return false;
    } catch (e) {
      showErrorNotification(e, 'فشل تحديث البيانات الشخصية');
      return false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('mobile_auth_token');
    localStorage.removeItem('mobile_user_profile');
  }

  return {
    token,
    user,
    isLoading,
    errorMessage,
    isAuthenticated,
    role,
    isSpecialist,
    isAdmin,
    isWorker,
    login,
    biometricLogin,
    fetchMe,
    updateProfile,
    logout,
    getOrGenerateDeviceUuid,
  };
});
