import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiClient } from '../api/client';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { showErrorNotification, showSuccessNotification } from '../utils/errorHandler';

export interface FacilityTask {
  id: number;
  employeeId?: number;
  title: string;
  description?: string;
  locationArea?: string;
  shiftDate: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  employee?: {
    id: number;
    name: string;
    category?: string;
    formalPersonalPhoto?: string;
  };
}

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<FacilityTask[]>([]);
  const allTasks = ref<FacilityTask[]>([]);
  const isLoading = ref(false);

  async function fetchMyTasks() {
    isLoading.value = true;
    try {
      const res = await apiClient.get('/tasks/my-tasks');
      if (res.data.status && res.data.data) {
        tasks.value = res.data.data;
      }
    } catch (e) {
      showErrorNotification(e, 'فشل تحميل مهام العمل');
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchAllTasks(status?: string) {
    isLoading.value = true;
    try {
      const url = status ? `/tasks/all?status=${status}` : '/tasks/all';
      const res = await apiClient.get(url);
      if (res.data.status && res.data.data) {
        allTasks.value = res.data.data;
      }
    } catch (e) {
      showErrorNotification(e, 'فشل تحميل قائمة المهام العامة');
    } finally {
      isLoading.value = false;
    }
  }

  async function createTask(payload: {
    employeeId: number;
    title: string;
    description?: string;
    locationArea?: string;
    shiftDate?: string;
  }) {
    try {
      const res = await apiClient.post('/tasks', payload);
      if (res.data.status) {
        if (res.data.data) {
          allTasks.value.unshift(res.data.data);
        }
        showSuccessNotification(res.data.message || 'تم إنشاء المهمة بنجاح');
        return true;
      }
      return false;
    } catch (e) {
      showErrorNotification(e, 'فشل إنشاء المهمة');
      return false;
    }
  }

  async function updateTask(taskId: number, payload: any) {
    try {
      const res = await apiClient.patch(`/tasks/${taskId}`, payload);
      if (res.data.status) {
        const idx = allTasks.value.findIndex((t) => t.id === taskId);
        if (idx !== -1) allTasks.value[idx] = res.data.data;
        const myIdx = tasks.value.findIndex((t) => t.id === taskId);
        if (myIdx !== -1) tasks.value[myIdx] = res.data.data;
        showSuccessNotification(res.data.message || 'تم تحديث المهمة بنجاح');
        return true;
      }
      return false;
    } catch (e) {
      showErrorNotification(e, 'فشل تحديث المهمة');
      return false;
    }
  }

  async function completeTask(taskId: number, notes?: string) {
    try {
      const res = await apiClient.patch(`/tasks/${taskId}/complete`, { notes });
      if (res.data.status) {
        const t = tasks.value.find((item) => item.id === taskId);
        if (t) {
          t.isCompleted = true;
          t.completedAt = new Date().toISOString();
        }
        const at = allTasks.value.find((item) => item.id === taskId);
        if (at) {
          at.isCompleted = true;
          at.completedAt = new Date().toISOString();
        }

        try {
          await Haptics.notification({ type: NotificationType.Success });
        } catch (e) {}

        showSuccessNotification(res.data.message || 'تم إنجاز المهمة بنجاح');
        return { success: true, message: res.data.message };
      }
      throw new Error(res.data.message);
    } catch (err: any) {
      showErrorNotification(err, 'فشل تسجيل إنجاز المهمة');
      return { success: false };
    }
  }

  async function deleteTask(taskId: number) {
    try {
      const res = await apiClient.delete(`/tasks/${taskId}`);
      if (res.data.status) {
        allTasks.value = allTasks.value.filter((t) => t.id !== taskId);
        tasks.value = tasks.value.filter((t) => t.id !== taskId);
        showSuccessNotification(res.data.message || 'تم حذف المهمة بنجاح');
        return true;
      }
      return false;
    } catch (e) {
      showErrorNotification(e, 'فشل حذف المهمة');
      return false;
    }
  }

  return {
    tasks,
    allTasks,
    isLoading,
    fetchMyTasks,
    fetchAllTasks,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
  };
});
