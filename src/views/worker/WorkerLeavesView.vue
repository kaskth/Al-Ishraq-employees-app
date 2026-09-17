<template>
  <div class="space-y-6 max-w-lg mx-auto font-cairo">
    <!-- Header -->
    <div>
      <h2 class="text-lg font-black text-slate-900">رصيد إجازاتي وطلباتي</h2>
      <p class="text-xs font-semibold text-slate-400">متابعة الأيام المتبقية وحالة الطلبات المقدمة</p>
    </div>

    <!-- Big Numbers Grid -->
    <div class="grid grid-cols-2 gap-4">
      <div class="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center space-y-2">
        <p class="text-xs font-bold text-slate-500">إجازتي الاعتيادية</p>
        <p class="text-4xl font-black text-brand-blue">{{ attendanceStore.leavesBalance?.annualRemaining ?? 14 }}</p>
        <p class="text-xs text-slate-400 font-semibold">يوم متبقي</p>
      </div>

      <div class="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center space-y-2">
        <p class="text-xs font-bold text-slate-500">إجازتي العارضة</p>
        <p class="text-4xl font-black text-brand-orange">{{ attendanceStore.leavesBalance?.casualRemaining ?? 7 }}</p>
        <p class="text-xs text-slate-400 font-semibold">أيام متبقية</p>
      </div>
    </div>

    <!-- Action Button -->
    <button
      @click="showModal = true"
      class="w-full py-4 rounded-2xl bg-brand-blue hover:bg-blue-800 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer touch-target-48"
    >
      <CalendarPlus class="w-5 h-5" />
      <span>طلب إجازة جديدة</span>
    </button>

    <!-- My Submitted Requests History -->
    <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
          <q-icon name="history" color="primary" size="20px" />
          <span>سجل طلبات الإجازات المقدمة</span>
        </h3>
        <span class="text-xs text-slate-400 font-bold">{{ attendanceStore.myRequests.leaves.length }} طلبات</span>
      </div>

      <div v-if="attendanceStore.myRequests.leaves.length === 0" class="py-6 text-center text-xs text-slate-400 font-bold">
        لا توجد طلبات إجازة مقدمة سابقاً
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="req in attendanceStore.myRequests.leaves"
          :key="req.id"
          class="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-900">إجازة {{ req.leaveType === 'ANNUAL' ? 'اعتيادية' : 'عارضة' }}</span>
              <q-badge :color="getStatusColor(req.status)" class="text-[10px] font-bold">
                {{ getStatusLabel(req.status) }}
              </q-badge>
            </div>
            <p class="text-[11px] text-slate-500 font-medium">
              الفترة: {{ formatDate(req.startDate) }} إلى {{ formatDate(req.endDate) }}
            </p>
          </div>

          <div v-if="req.status === 'PENDING'">
            <q-btn
              unelevated
              color="red-1"
              text-color="red-7"
              label="إلغاء"
              size="sm"
              class="rounded-xl px-3 font-bold"
              @click="cancelRequest(req.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Request Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-cairo">
      <div class="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
        <h3 class="text-base font-black text-slate-900 border-b pb-3">طلب إجازة جديدة</h3>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">نوع الإجازة</label>
          <select v-model="form.leaveType" class="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold">
            <option value="ANNUAL">إجازة اعتيادية</option>
            <option value="CASUAL">إجازة عارضة</option>
            <option value="SICK">إجازة مرضية</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">من يوم</label>
            <input v-model="form.startDate" type="date" class="w-full p-2.5 rounded-xl bg-slate-50 border text-xs" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">إلى يوم</label>
            <input v-model="form.endDate" type="date" class="w-full p-2.5 rounded-xl bg-slate-50 border text-xs" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">السبب (اختياري)</label>
          <input v-model="form.reason" type="text" placeholder="سبب الإجازة..." class="w-full p-2.5 rounded-xl bg-slate-50 border text-xs" />
        </div>

        <div class="flex items-center gap-2 pt-2">
          <q-btn
            flat
            no-caps
            label="إلغاء"
            color="grey-8"
            @click="showModal = false"
            class="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700"
          />
          <q-btn
            unelevated
            no-caps
            :label="isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'"
            color="primary"
            :loading="isSubmitting"
            @click="submitLeave"
            class="flex-1 py-2.5 rounded-xl font-black text-xs shadow-md"
            style="background-color: #313C8E !important; color: #ffffff !important;"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAttendanceStore } from '../../stores/attendance.store';
import { useQuasar } from 'quasar';
import { CalendarPlus } from 'lucide-vue-next';

const $q = useQuasar();
const attendanceStore = useAttendanceStore();
const showModal = ref(false);
const isSubmitting = ref(false);

const form = ref({
  leaveType: 'ANNUAL',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  reason: '',
});

onMounted(() => {
  attendanceStore.fetchLeavesBalance();
  attendanceStore.fetchMyRequests();
});

async function submitLeave() {
  isSubmitting.value = true;
  try {
    const ok = await attendanceStore.submitLeave(form.value);
    if (ok) {
      showModal.value = false;
      form.value.reason = '';
      await attendanceStore.fetchLeavesBalance();
    }
  } finally {
    isSubmitting.value = false;
  }
}

function cancelRequest(id: number) {
  $q.dialog({
    title: 'إلغاء الطلب',
    message: 'هل تريد بالتأكيد إلغاء هذا الطلب؟',
    ok: { label: 'نعم، إلغاء', color: 'red-6', unelevated: true },
    cancel: { label: 'تراجع', flat: true },
  }).onOk(async () => {
    await attendanceStore.cancelMyRequest('LEAVE', id);
    await attendanceStore.fetchLeavesBalance();
  });
}

function getStatusColor(status: string) {
  if (status === 'APPROVED') return 'green-7';
  if (status === 'REJECTED') return 'red-7';
  return 'amber-8';
}

function getStatusLabel(status: string) {
  if (status === 'APPROVED') return 'معتمد';
  if (status === 'REJECTED') return 'مرفوض';
  return 'قيد المراجعة';
}

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
}
</script>
