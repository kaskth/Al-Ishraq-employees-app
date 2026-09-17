<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-black text-slate-900">لوحة الإشراف والمتابعة</h2>
        <p class="text-xs font-semibold text-slate-400">
          مؤشرات انضباط الكوادر والرقابة الجغرافية والطلبات المعلقة
        </p>
      </div>
      <q-btn
        unelevated
        color="primary"
        icon="add_task"
        label="تكليف مهمة مرافق"
        class="rounded-2xl text-xs font-bold px-4 py-2"
        @click="showCreateTaskDialog = true"
      />
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
      <!-- Present Staff -->
      <div class="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
        <p class="text-[11px] font-bold text-slate-400">الحاضرون اليوم</p>
        <p class="text-2xl font-black text-emerald-600">{{ metrics.presentCount }}</p>
        <p class="text-[10px] text-slate-400 font-semibold">من إجمالي {{ metrics.totalEmployees }} موظف</p>
      </div>

      <!-- Absent Staff -->
      <div class="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
        <p class="text-[11px] font-bold text-slate-400">الغياب اليومي</p>
        <p class="text-2xl font-black text-rose-600">{{ metrics.absentCount }}</p>
        <p class="text-[10px] text-slate-400 font-semibold">بدون إثبات حضور</p>
      </div>

      <!-- Pending Approvals -->
      <div
        @click="$router.push('/admin/approvals')"
        class="p-4 rounded-3xl bg-white border border-amber-200 shadow-xs space-y-1 cursor-pointer hover:bg-amber-50/50 transition-colors"
      >
        <p class="text-[11px] font-bold text-amber-700">طلبات عالقة</p>
        <p class="text-2xl font-black text-amber-600">{{ metrics.pendingLeaves }}</p>
        <p class="text-[10px] text-amber-600/80 font-semibold">إجازات وأذون بحاجة لاعتماد</p>
      </div>

      <!-- Out-of-bounds Attempts -->
      <div class="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
        <p class="text-[11px] font-bold text-slate-400">خارج المظلة (GPS)</p>
        <p class="text-2xl font-black text-slate-700">{{ metrics.outOfBoundsAttempts }}</p>
        <p class="text-[10px] text-slate-400 font-semibold">محاولات حضور مرفوضة</p>
      </div>

      <!-- Mock GPS Attempts -->
      <div class="p-4 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-1">
        <p class="text-[11px] font-bold text-rose-600">كشف Fake GPS</p>
        <p class="text-2xl font-black text-rose-600">{{ metrics.mockAttempts }}</p>
        <p class="text-[10px] text-rose-400 font-semibold">محاولات تزييف موقع محظورة</p>
      </div>
    </div>

    <!-- Quick Navigation to Approvals -->
    <div
      @click="$router.push('/admin/approvals')"
      class="p-5 rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shadow-lg shadow-blue-900/20 cursor-pointer"
    >
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
          <FileCheck class="w-6 h-6 text-brand-orange" />
        </div>
        <div>
          <h3 class="text-sm font-black text-white">إدارة اعتمادات الإجازات والأذون</h3>
          <p class="text-xs text-blue-200">البت السريع في طلبات الكوادر مع تدوين الملاحظات</p>
        </div>
      </div>
      <ChevronLeft class="w-5 h-5 rtl-mirror text-white/70" />
    </div>

    <!-- Facility Tasks Section (Admin View) -->
    <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
          <q-icon name="cleaning_services" class="text-teal-600" size="20px" />
          <span>متابعة مهام المرافق والخدمات المساندة</span>
        </h3>
        <span class="text-xs text-slate-400 font-bold">{{ taskStore.allTasks.length }} مهمة</span>
      </div>

      <div v-if="taskStore.allTasks.length === 0" class="py-6 text-center text-xs text-slate-400 font-bold">
        لا توجد مهام مرافق مسجلة حالياً
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="task in taskStore.allTasks"
          :key="task.id"
          class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-900">{{ task.title }}</span>
              <q-badge :color="task.isCompleted ? 'green-7' : 'amber-8'" class="text-[10px]">
                {{ task.isCompleted ? 'مكتملة' : 'قيد التنفيذ' }}
              </q-badge>
            </div>
            <p class="text-[11px] text-slate-500 font-medium">
              المكلف: {{ task.employee?.name || 'موظف خدمات' }} • {{ task.locationArea || 'المركز العام' }}
            </p>
          </div>

          <div class="flex items-center gap-1">
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="delete"
              color="red-5"
              @click="confirmDeleteTask(task.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Create Facility Task Dialog -->
    <CreateFacilityTaskDialog
      v-model="showCreateTaskDialog"
      @task-created="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiClient } from '../../api/client';
import { useTaskStore } from '../../stores/task.store';
import { useQuasar } from 'quasar';
import { FileCheck, ChevronLeft } from 'lucide-vue-next';
import CreateFacilityTaskDialog from './components/CreateFacilityTaskDialog.vue';

const $q = useQuasar();
const taskStore = useTaskStore();
const showCreateTaskDialog = ref(false);

const metrics = ref({
  totalEmployees: 0,
  presentCount: 0,
  absentCount: 0,
  pendingLeaves: 0,
  outOfBoundsAttempts: 0,
  mockAttempts: 0,
});

async function loadData() {
  try {
    const res = await apiClient.get('/admin/attendance-overview');
    if (res.data.status) {
      metrics.value = res.data.data;
    }
  } catch (e) {}

  await taskStore.fetchAllTasks();
}

onMounted(() => {
  loadData();
});

function confirmDeleteTask(id: number) {
  $q.dialog({
    title: 'تأكيد الحذف',
    message: 'هل أنت متأكد من حذف هذه المهمة من السجل العام؟',
    ok: { label: 'حذف', color: 'red-6', unelevated: true },
    cancel: { label: 'إلغاء', flat: true },
  }).onOk(async () => {
    await taskStore.deleteTask(id);
  });
}
</script>
