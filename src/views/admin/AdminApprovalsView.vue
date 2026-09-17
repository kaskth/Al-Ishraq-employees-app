<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button
          @click="$router.back()"
          class="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          <ArrowRight class="w-4 h-4 rtl-mirror" />
        </button>
        <div>
          <h2 class="text-lg font-black text-slate-900">اعتمادات الطلبات المعلقة</h2>
          <p class="text-xs font-semibold text-slate-400">مراجعة وإقرار طلبات الإجازات والأذون</p>
        </div>
      </div>
      <button
        @click="fetchRequests"
        class="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-brand-blue cursor-pointer"
        title="تحديث"
      >
        <RefreshCw class="w-4 h-4" :class="isLoading ? 'animate-spin' : ''" />
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-if="pendingLeaves.length === 0 && pendingPermissions.length === 0 && !isLoading"
      class="p-8 text-center rounded-3xl bg-white border border-slate-200/80 space-y-2"
    >
      <CheckCircle2 class="w-10 h-10 text-emerald-500 mx-auto" />
      <p class="text-sm font-bold text-slate-700">لا توجد طلبات معلقة حالياً</p>
      <p class="text-xs text-slate-400">تم البت في كافة طلبات الكوادر</p>
    </div>

    <!-- Leaves Requests List -->
    <div v-if="pendingLeaves.length > 0" class="space-y-3">
      <h3 class="text-xs font-black text-slate-600 uppercase tracking-wider px-1">
        طلبات الإجازات ({{ pendingLeaves.length }})
      </h3>

      <div
        v-for="leave in pendingLeaves"
        :key="leave.id"
        class="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue font-black flex items-center justify-center text-sm">
              {{ leave.employee?.name?.[0] || 'م' }}
            </div>
            <div>
              <h4 class="text-sm font-black text-slate-900">{{ leave.employee?.name }}</h4>
              <p class="text-[11px] text-slate-400 font-semibold">{{ leave.employee?.category }} • {{ leave.employee?.section }}</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
            {{ formatLeaveType(leave.leaveType) }}
          </span>
        </div>

        <div class="p-3 rounded-2xl bg-slate-50 text-xs font-semibold text-slate-600 space-y-1">
          <div class="flex items-center justify-between">
            <span>المدة: {{ leave.totalDays }} يوم</span>
            <span>من {{ formatDate(leave.startDate) }} إلى {{ formatDate(leave.endDate) }}</span>
          </div>
          <p v-if="leave.reason" class="text-slate-500 italic mt-1">السبب: {{ leave.reason }}</p>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <button
            @click="handleAction(leave.id, 'LEAVE', 'REJECT')"
            class="flex-1 py-2.5 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 transition-colors cursor-pointer"
          >
            رفض الطلب
          </button>
          <button
            @click="handleAction(leave.id, 'LEAVE', 'APPROVE')"
            class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            اعتماد الإجازة
          </button>
        </div>
      </div>
    </div>

    <!-- Permission Requests List -->
    <div v-if="pendingPermissions.length > 0" class="space-y-3">
      <h3 class="text-xs font-black text-slate-600 uppercase tracking-wider px-1">
        أذون المغادرة الساعية ({{ pendingPermissions.length }})
      </h3>

      <div
        v-for="perm in pendingPermissions"
        :key="perm.id"
        class="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-orange-50 text-brand-orange font-black flex items-center justify-center text-sm">
              {{ perm.employee?.name?.[0] || 'م' }}
            </div>
            <div>
              <h4 class="text-sm font-black text-slate-900">{{ perm.employee?.name }}</h4>
              <p class="text-[11px] text-slate-400 font-semibold">{{ perm.employee?.category }}</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-blue-50 text-brand-blue border border-blue-200 text-[10px] font-bold">
            إذن {{ perm.hoursRequested }} ساعة
          </span>
        </div>

        <div class="p-3 rounded-2xl bg-slate-50 text-xs font-semibold text-slate-600 space-y-1">
          <p>تاريخ الإذن: {{ formatDate(perm.date) }}</p>
          <p v-if="perm.reason" class="text-slate-500 italic">السبب: {{ perm.reason }}</p>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <button
            @click="handleAction(perm.id, 'PERMISSION', 'REJECT')"
            class="flex-1 py-2.5 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 transition-colors cursor-pointer"
          >
            رفض
          </button>
          <button
            @click="handleAction(perm.id, 'PERMISSION', 'APPROVE')"
            class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            اعتماد الإذن
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiClient } from '../../api/client';
import { ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-vue-next';

const pendingLeaves = ref<any[]>([]);
const pendingPermissions = ref<any[]>([]);
const isLoading = ref(false);

onMounted(() => {
  fetchRequests();
});

async function fetchRequests() {
  isLoading.value = true;
  try {
    const res = await apiClient.get('/admin/pending-requests');
    if (res.data.status && res.data.data) {
      pendingLeaves.value = res.data.data.leaves;
      pendingPermissions.value = res.data.data.permissions;
    }
  } catch (e) {}
  finally {
    isLoading.value = false;
  }
}

async function handleAction(requestId: number, type: 'LEAVE' | 'PERMISSION', action: 'APPROVE' | 'REJECT') {
  try {
    await apiClient.patch(`/admin/requests/${requestId}/action`, { type, action });
    fetchRequests();
  } catch (e: any) {
    alert(e.response?.data?.message || 'فشلت معالجة الطلب');
  }
}

function formatLeaveType(t: string) {
  if (t === 'ANNUAL') return 'إجازة اعتيادية';
  if (t === 'CASUAL') return 'إجازة عارضة';
  return 'إجازة مرضية';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' });
}
</script>
