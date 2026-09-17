import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiClient } from '../api/client';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { useAuthStore } from './auth.store';
import { getErrorMessage, showErrorNotification, showSuccessNotification } from '../utils/errorHandler';

export interface AssignedChild {
  id: number;
  name: string;
  gender: string;
  age?: number;
  category: string;
  section: string;
  formalPersonalPhoto?: string;
  lastAssessmentDate?: string;
  nextAssessmentDate?: string;
}

export interface SessionEvaluationPayload {
  childId: number;
  scheduleId?: number;
  part?: number;
  goalsProgressJson?: string;
  behaviorNotes?: string;
  sensoryNotes?: string;
  overallScore?: number;
  offlineUuid?: string;
}

const OFFLINE_THERAPY_KEY = 'OFFLINE_THERAPY_EVALUATIONS_QUEUE';

export const useTherapyStore = defineStore('therapy', () => {
  const myChildren = ref<AssignedChild[]>([]);
  const activeChild = ref<any | null>(null);
  const activeIep = ref<any | null>(null);
  const evaluationHistory = ref<any[]>([]);
  const incidentsList = ref<any[]>([]);
  const offlineQueue = ref<SessionEvaluationPayload[]>([]);
  const isSyncing = ref(false);
  const isLoading = ref(false);

  function initOfflineQueue() {
    try {
      const raw = localStorage.getItem(OFFLINE_THERAPY_KEY);
      if (raw) offlineQueue.value = JSON.parse(raw);
    } catch (e) {
      offlineQueue.value = [];
    }

    window.addEventListener('online', () => {
      flushOfflineQueue();
    });
  }

  function saveOfflineQueue() {
    try {
      localStorage.setItem(OFFLINE_THERAPY_KEY, JSON.stringify(offlineQueue.value));
    } catch (e) {}
  }

  async function fetchMyChildren() {
    isLoading.value = true;
    try {
      const res = await apiClient.get('/therapy/my-children');
      if (res.data.status && res.data.data) {
        myChildren.value = res.data.data;
      }
    } catch (e) {
      showErrorNotification(e, 'فشل تحميل قائمة الأطفال');
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchChildIep(childId: number) {
    isLoading.value = true;
    try {
      const res = await apiClient.get(`/therapy/children/${childId}/iep`);
      if (res.data.status && res.data.data) {
        activeIep.value = res.data.data;
      }
    } catch (e) {
      showErrorNotification(e, 'فشل تحميل الخطة التربوية');
    } finally {
      isLoading.value = false;
    }
  }

  async function evaluateSession(payload: SessionEvaluationPayload) {
    const offlineUuid = payload.offlineUuid || 'OFF-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
    payload.offlineUuid = offlineUuid;

    if (!navigator.onLine) {
      offlineQueue.value.push(payload);
      saveOfflineQueue();
      try {
        await Haptics.notification({ type: NotificationType.Warning });
      } catch (e) {}
      showSuccessNotification('تم حفظ الجلسة محلياً في الذاكرة (دون اتصال)');
      return { success: true, offline: true, message: 'تم حفظ الجلسة محلياً' };
    }

    try {
      const res = await apiClient.post('/therapy/sessions/evaluate', payload);
      if (res.data.status) {
        try {
          await Haptics.notification({ type: NotificationType.Success });
        } catch (e) {}
        showSuccessNotification(res.data.message || 'تم حفظ التقييم بنجاح');
        return { success: true, offline: false, message: res.data.message };
      }
      throw new Error(res.data.message);
    } catch (err: any) {
      offlineQueue.value.push(payload);
      saveOfflineQueue();
      showSuccessNotification('تعذر الاتصال بالسيرفر، تم حفظ التقييم محلياً للمزامنة');
      return { success: true, offline: true, message: 'تم الحفظ محلياً' };
    }
  }

  async function fetchEvaluationHistory(childId?: number) {
    isLoading.value = true;
    try {
      const url = childId ? `/therapy/sessions/evaluations?childId=${childId}` : '/therapy/sessions/evaluations';
      const res = await apiClient.get(url);
      if (res.data.status && res.data.data) {
        evaluationHistory.value = res.data.data;
      }
    } catch (e) {
      showErrorNotification(e, 'فشل جلب سجل التقييمات');
    } finally {
      isLoading.value = false;
    }
  }

  async function updateEvaluation(id: number, data: any) {
    try {
      const res = await apiClient.patch(`/therapy/sessions/evaluations/${id}`, data);
      if (res.data.status) {
        const idx = evaluationHistory.value.findIndex((e) => e.id === id);
        if (idx !== -1) evaluationHistory.value[idx] = res.data.data;
        showSuccessNotification(res.data.message || 'تم تحديث التقييم بنجاح');
        return true;
      }
      return false;
    } catch (e) {
      showErrorNotification(e, 'فشل تحديث التقييم');
      return false;
    }
  }

  async function deleteEvaluation(id: number) {
    try {
      const res = await apiClient.delete(`/therapy/sessions/evaluations/${id}`);
      if (res.data.status) {
        evaluationHistory.value = evaluationHistory.value.filter((e) => e.id !== id);
        showSuccessNotification(res.data.message || 'تم حذف التقييم بنجاح');
        return true;
      }
      return false;
    } catch (e) {
      showErrorNotification(e, 'فشل حذف التقييم');
      return false;
    }
  }

  async function flushOfflineQueue() {
    if (offlineQueue.value.length === 0 || !navigator.onLine || isSyncing.value) return;

    const authStore = useAuthStore();
    isSyncing.value = true;
    try {
      const items = [...offlineQueue.value];
      const res = await apiClient.post('/therapy/sessions/sync-offline-batch', {
        deviceUuid: authStore.getOrGenerateDeviceUuid(),
        sessions: items,
      });

      if (res.data.status) {
        offlineQueue.value = [];
        saveOfflineQueue();
        try {
          await Haptics.notification({ type: NotificationType.Success });
        } catch (e) {}
        showSuccessNotification('تمت مزامنة التقييمات المحفوظة بنجاح');
      }
    } catch (e) {
      console.warn('Offline sync failed, will retry:', e);
    } finally {
      isSyncing.value = false;
    }
  }

  async function reportIncident(childId: number, incidentType: string, description: string, severity = 'MEDIUM', actionTaken?: string) {
    try {
      const res = await apiClient.post('/therapy/incidents', {
        childId,
        incidentType,
        description,
        severity,
        actionTaken,
      });
      if (res.data.status) {
        try {
          await Haptics.notification({ type: NotificationType.Warning });
        } catch (e) {}
        showSuccessNotification(res.data.message || 'تم تسجيل البلاغ وإشعار الإدارة');
        return { success: true, message: res.data.message };
      }
      throw new Error(res.data.message);
    } catch (err: any) {
      showErrorNotification(err, 'فشل إرسال البلاغ');
      return { success: false, message: getErrorMessage(err) };
    }
  }

  async function fetchIncidents(childId?: number) {
    try {
      const url = childId ? `/therapy/incidents?childId=${childId}` : '/therapy/incidents';
      const res = await apiClient.get(url);
      if (res.data.status && res.data.data) {
        incidentsList.value = res.data.data;
      }
    } catch (e) {
      showErrorNotification(e, 'فشل جلب قائمة البلاغات');
    }
  }

  async function updateIncident(id: number, data: any) {
    try {
      const res = await apiClient.patch(`/therapy/incidents/${id}`, data);
      if (res.data.status) {
        const idx = incidentsList.value.findIndex((i) => i.id === id);
        if (idx !== -1) incidentsList.value[idx] = res.data.data;
        showSuccessNotification(res.data.message || 'تم تحديث البلاغ بنجاح');
        return true;
      }
      return false;
    } catch (e) {
      showErrorNotification(e, 'فشل تحديث البلاغ');
      return false;
    }
  }

  async function deleteIncident(id: number) {
    try {
      const res = await apiClient.delete(`/therapy/incidents/${id}`);
      if (res.data.status) {
        incidentsList.value = incidentsList.value.filter((i) => i.id !== id);
        showSuccessNotification(res.data.message || 'تم حذف البلاغ بنجاح');
        return true;
      }
      return false;
    } catch (e) {
      showErrorNotification(e, 'فشل حذف البلاغ');
      return false;
    }
  }

  return {
    myChildren,
    activeChild,
    activeIep,
    evaluationHistory,
    incidentsList,
    offlineQueue,
    isSyncing,
    isLoading,
    initOfflineQueue,
    fetchMyChildren,
    fetchChildIep,
    evaluateSession,
    fetchEvaluationHistory,
    updateEvaluation,
    deleteEvaluation,
    flushOfflineQueue,
    reportIncident,
    fetchIncidents,
    updateIncident,
    deleteIncident,
  };
});
