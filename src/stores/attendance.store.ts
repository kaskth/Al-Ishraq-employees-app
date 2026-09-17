import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '../api/client';
import { Geolocation } from '@capacitor/geolocation';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { useAuthStore } from './auth.store';
import { showErrorNotification, showSuccessNotification, getErrorMessage } from '../utils/errorHandler';

export const useAttendanceStore = defineStore('attendance', () => {
  const isCheckedIn = ref(false);
  const hasCheckedOut = ref(false);
  const checkInTime = ref<string | null>(null);
  const checkOutTime = ref<string | null>(null);
  const branchName = ref<string | null>(null);
  const shiftTime = ref<{ startTime: string; endTime: string } | null>(null);
  const shiftDetails = ref<any>(null);
  const attendanceWindow = ref<{
    canCheckIn: boolean;
    canCheckOut: boolean;
    windowStatus: 'BEFORE_WINDOW' | 'OPEN' | 'AFTER_WINDOW' | 'OFF_DAY' | 'ALREADY_CHECKED_OUT' | 'ALREADY_CHECKED_IN';
    windowMessage: string;
    windowOpensAt?: string;
    windowClosesAt?: string;
    serverTime?: string;
  } | null>(null);
  const primaryBranch = ref<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    address?: string;
  } | null>(null);
  const deviceBinding = ref<{
    isBound: boolean;
    deviceUuid: string | null;
    deviceModel?: string | null;
    registeredAt?: string | null;
  } | null>(null);

  const gpsStatus = ref<'READY' | 'DISABLED' | 'CHECKING' | 'DENIED'>('CHECKING');
  const currentDistanceMeters = ref<number | null>(null);
  const isInsideGeofence = ref<boolean | null>(null);
  const gpsErrorMessage = ref<string | null>(null);

  const durationFormatted = ref<string | null>(null);
  const workedMinutes = ref<number>(0);
  const todayLogs = ref<any[]>([]);
  const leavesBalance = ref<any>(null);
  const myRequests = ref<{ leaves: any[]; permissions: any[] }>({ leaves: [], permissions: [] });
  const isLoading = ref(false);
  const lastError = ref<string | null>(null);

  function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  async function checkReadiness() {
    gpsStatus.value = 'CHECKING';
    gpsErrorMessage.value = null;

    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 8000,
      });

      gpsStatus.value = 'READY';

      if (primaryBranch.value && primaryBranch.value.latitude && primaryBranch.value.longitude) {
        const dist = calculateDistanceMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          primaryBranch.value.latitude,
          primaryBranch.value.longitude,
        );
        currentDistanceMeters.value = dist;
        isInsideGeofence.value = dist <= (primaryBranch.value.radiusMeters || 50);
      }
    } catch (err: any) {
      const errCode = err?.code;
      const msg = String(err?.message || '').toLowerCase();

      if (errCode === 1 || msg.includes('denied') || msg.includes('permission')) {
        gpsStatus.value = 'DENIED';
        gpsErrorMessage.value = 'إذن الوصول للموقع مرفوض';
      } else {
        gpsStatus.value = 'DISABLED';
        gpsErrorMessage.value = 'خدمة الموقع (GPS) مغلقة على الهاتف';
      }
      currentDistanceMeters.value = null;
      isInsideGeofence.value = null;
    }
  }

  const canPunch = computed(() => {
    if (isLoading.value) return false;

    if (isCheckedIn.value) {
      if (attendanceWindow.value && attendanceWindow.value.canCheckOut === false) {
        return false;
      }
      return true;
    }

    // Check-in gating
    if (attendanceWindow.value && attendanceWindow.value.canCheckIn === false) {
      return false;
    }

    return true;
  });

  const punchDisabledReason = computed(() => {
    if (isCheckedIn.value) {
      if (attendanceWindow.value && attendanceWindow.value.canCheckOut === false) {
        return attendanceWindow.value.windowMessage || 'تسجيل الانصراف غير متاح حالياً';
      }
      return null;
    }

    if (attendanceWindow.value && attendanceWindow.value.canCheckIn === false) {
      return attendanceWindow.value.windowMessage;
    }

    if (gpsStatus.value === 'DISABLED') {
      return 'خدمة الموقع (GPS) مغلقة على هاتفك';
    }

    if (gpsStatus.value === 'DENIED') {
      return 'إذن الوصول للموقع الجغرافي مرفوض';
    }

    if (isInsideGeofence.value === false && currentDistanceMeters.value !== null) {
      return `أنت خارج نطاق المقر (المسافة: ${currentDistanceMeters.value} متراً)`;
    }

    return null;
  });

  async function pairCurrentDevice(deviceModel?: string) {
    const authStore = useAuthStore();
    isLoading.value = true;
    lastError.value = null;

    try {
      const uuid = authStore.getOrGenerateDeviceUuid();
      const res = await apiClient.post('/attendance/pair-device', {
        deviceUuid: uuid,
        deviceModel: deviceModel || navigator.userAgent,
      });

      if (res.data.status) {
        showSuccessNotification(res.data.message || 'تم اعتماد الهاتف بنجاح');
        if (deviceBinding.value) {
          deviceBinding.value.isBound = true;
          deviceBinding.value.deviceUuid = uuid;
        }
        await fetchTodayStatus();
        return { success: true, message: res.data.message };
      }
      throw new Error(res.data.message || 'فشل اعتماد الهاتف');
    } catch (err: any) {
      showErrorNotification(err, 'فشل اعتماد الهاتف');
      lastError.value = err.response?.data?.message || err.message;
      return { success: false, message: lastError.value };
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchTodayStatus() {
    isLoading.value = true;
    lastError.value = null;
    try {
      const res = await apiClient.get('/attendance/status-today');
      if (res.data.status && res.data.data) {
        const d = res.data.data;
        isCheckedIn.value = d.isCheckedIn;
        hasCheckedOut.value = d.hasCheckedOut;
        checkInTime.value = d.checkInTime;
        checkOutTime.value = d.checkOutTime;
        branchName.value = d.branchName;
        shiftTime.value = d.shift;
        shiftDetails.value = d.shift;
        attendanceWindow.value = d.attendanceWindow || null;
        primaryBranch.value = d.primaryBranch || null;
        deviceBinding.value = d.deviceBinding || null;
        durationFormatted.value = d.durationFormatted;
        workedMinutes.value = d.workedMinutes || 0;
        todayLogs.value = d.todayLogs || [];

        // Check GPS readiness in background
        checkReadiness();
      }
    } catch (err: any) {
      console.warn('Error fetching today attendance:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function performSmartCheckIn() {
    const authStore = useAuthStore();
    isLoading.value = true;
    lastError.value = null;

    if (attendanceWindow.value && attendanceWindow.value.canCheckIn === false) {
      lastError.value = attendanceWindow.value.windowMessage;
      showErrorNotification({ message: attendanceWindow.value.windowMessage }, 'موعد الوردية');
      isLoading.value = false;
      return { success: false, message: lastError.value };
    }

    try {
      try {
        const canBiometric = await NativeBiometric.isAvailable();
        if (canBiometric.isAvailable) {
          await NativeBiometric.verifyIdentity({
            reason: 'تأكيد الحضور ببصمة الموظف الحيوية',
            title: 'إثبات الحضور',
            subtitle: 'المس المستشعر للتأكيد',
          });
        }
      } catch (bioErr) {
        console.warn('Biometrics check bypassed or not available:', bioErr);
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const isMock = (position as any)?.coords?.mocked || false;

      const res = await apiClient.post('/attendance/check-in', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        deviceUuid: authStore.getOrGenerateDeviceUuid(),
        isMockLocation: isMock,
        biometricVerified: true,
      });

      if (res.data.status) {
        isCheckedIn.value = true;
        checkInTime.value = res.data.data.checkInTime;
        branchName.value = res.data.data.branchName;

        try {
          await Haptics.notification({ type: NotificationType.Success });
        } catch (e) {}

        showSuccessNotification(res.data.message || 'تم إثبات الحضور بنجاح');
        await fetchTodayStatus();
        return { success: true, message: res.data.message };
      }
      throw new Error(res.data.message || 'فشل إثبات الحضور');
    } catch (err: any) {
      checkReadiness();
      showErrorNotification(err, 'فشل إثبات الحضور');
      lastError.value = getErrorMessage(err);
      try {
        await Haptics.notification({ type: NotificationType.Error });
      } catch (e) {}
      return { success: false, message: lastError.value };
    } finally {
      isLoading.value = false;
    }
  }

  async function performCheckOut() {
    const authStore = useAuthStore();
    isLoading.value = true;
    lastError.value = null;

    if (attendanceWindow.value && attendanceWindow.value.canCheckOut === false) {
      lastError.value = attendanceWindow.value.windowMessage || 'تسجيل الانصراف غير متاح حالياً';
      showErrorNotification({ message: lastError.value }, 'تسجيل الانصراف');
      isLoading.value = false;
      return { success: false, message: lastError.value };
    }

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const isMock = (position as any)?.coords?.mocked || false;

      const res = await apiClient.post('/attendance/check-out', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        deviceUuid: authStore.getOrGenerateDeviceUuid(),
        isMockLocation: isMock,
      });

      if (res.data.status) {
        isCheckedIn.value = false;
        try {
          await Haptics.notification({ type: NotificationType.Success });
        } catch (e) {}
        showSuccessNotification(res.data.message || 'تم تسجيل الانصراف بنجاح');
        await fetchTodayStatus();
        return { success: true, message: res.data.message };
      }
      throw new Error(res.data.message || 'فشل تسجيل الانصراف');
    } catch (err: any) {
      checkReadiness();
      showErrorNotification(err, 'فشل تسجيل الانصراف');
      lastError.value = getErrorMessage(err);
      return { success: false, message: lastError.value };
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchLeavesBalance() {
    try {
      const res = await apiClient.get('/hr/leaves-balance');
      if (res.data.status && res.data.data) {
        leavesBalance.value = res.data.data;
      }
    } catch (e) {
      console.warn('Failed to fetch leaves balance:', e);
    }
  }

  async function fetchMyRequests() {
    isLoading.value = true;
    try {
      const res = await apiClient.get('/hr/my-requests');
      if (res.data.status && res.data.data) {
        myRequests.value = res.data.data;
      }
    } catch (e) {
      showErrorNotification(e, 'فشل تحميل سجل الطلبات');
    } finally {
      isLoading.value = false;
    }
  }

  async function submitLeave(payload: { leaveType: string; startDate: string; endDate: string; totalDays?: number; reason?: string }) {
    try {
      const res = await apiClient.post('/hr/request-leave', payload);
      if (res.data.status) {
        showSuccessNotification(res.data.message || 'تم إرسال طلب الإجازة بنجاح');
        await fetchMyRequests();
        return true;
      }
      return false;
    } catch (e) {
      showErrorNotification(e, 'فشل إرسال طلب الإجازة');
      return false;
    }
  }

  async function submitPermission(payload: { date: string; hoursRequested: number; reason?: string }) {
    try {
      const res = await apiClient.post('/hr/request-permission', payload);
      if (res.data.status) {
        showSuccessNotification(res.data.message || 'تم إرسال طلب إذن المغادرة بنجاح');
        await fetchMyRequests();
        return true;
      }
      return false;
    } catch (e) {
      showErrorNotification(e, 'فشل إرسال طلب الإذن');
      return false;
    }
  }

  async function cancelMyRequest(type: 'LEAVE' | 'PERMISSION', id: number) {
    try {
      const res = await apiClient.delete(`/hr/my-requests/${type}/${id}`);
      if (res.data.status) {
        showSuccessNotification(res.data.message || 'تم إلغاء الطلب بنجاح');
        if (type === 'LEAVE') {
          myRequests.value.leaves = myRequests.value.leaves.filter((item) => item.id !== id);
        } else {
          myRequests.value.permissions = myRequests.value.permissions.filter((item) => item.id !== id);
        }
        return true;
      }
      return false;
    } catch (e) {
      showErrorNotification(e, 'فشل إلغاء الطلب');
      return false;
    }
  }

  return {
    isCheckedIn,
    hasCheckedOut,
    checkInTime,
    checkOutTime,
    branchName,
    shiftTime,
    shiftDetails,
    attendanceWindow,
    primaryBranch,
    deviceBinding,
    gpsStatus,
    currentDistanceMeters,
    isInsideGeofence,
    gpsErrorMessage,
    canPunch,
    punchDisabledReason,
    durationFormatted,
    workedMinutes,
    todayLogs,
    leavesBalance,
    myRequests,
    isLoading,
    lastError,
    checkReadiness,
    pairCurrentDevice,
    fetchTodayStatus,
    performSmartCheckIn,
    performCheckOut,
    fetchLeavesBalance,
    fetchMyRequests,
    submitLeave,
    submitPermission,
    cancelMyRequest,
  };
});
