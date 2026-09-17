<template>
  <div class="space-y-6 max-w-lg mx-auto">
    <!-- Big Attendance Action Card -->
    <div class="p-6 rounded-3xl bg-gradient-to-tr from-brand-blue to-indigo-800 text-white shadow-xl text-center space-y-4">
      <h2 class="text-xl font-black">تسجيل الحضور اليومي</h2>
      <p class="text-xs text-blue-200 font-semibold">
        {{ attendanceStore.isCheckedIn ? 'تم إثبات حضورك بنجاح لليوم' : 'اضغط الزر لإثبات الحضور بالبصمة والموقع' }}
      </p>

      <div class="py-2 flex justify-center">
        <button
          v-if="!attendanceStore.isCheckedIn"
          @click="attendanceStore.performSmartCheckIn"
          :disabled="attendanceStore.isLoading"
          class="w-36 h-36 rounded-full bg-brand-orange text-white flex flex-col items-center justify-center shadow-lg shadow-orange-500/40 border-4 border-white active:scale-95 transition-transform cursor-pointer touch-target-48"
        >
          <Fingerprint class="w-14 h-14 mb-1" />
          <span class="text-sm font-black">إثبات الحضور</span>
        </button>

        <div v-else class="p-4 rounded-2xl bg-white/15 border border-white/20 text-center w-full">
          <p class="text-xs text-blue-200 font-bold">وقت الدخول الموثق</p>
          <p class="text-2xl font-black text-white mt-1">{{ formatTime(attendanceStore.checkInTime) }}</p>
          <p class="text-xs text-emerald-300 font-bold mt-1">المقر: {{ attendanceStore.branchName }}</p>
        </div>
      </div>
    </div>

    <!-- Daily Facility Tasks Checklist -->
    <div class="space-y-4">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-base font-black text-slate-900 flex items-center gap-2">
          <ListTodo class="w-5 h-5 text-brand-orange" />
          <span>مهام العمل اليومية</span>
        </h3>
        <span class="text-xs font-bold text-slate-500">
          {{ completedCount }} من {{ taskStore.tasks.length }} منجزة
        </span>
      </div>

      <!-- Tasks List -->
      <div class="space-y-3">
        <div
          v-for="task in taskStore.tasks"
          :key="task.id"
          class="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-4 transition-all"
          :class="task.isCompleted ? 'bg-emerald-50/50 border-emerald-200' : ''"
        >
          <div class="min-w-0 space-y-1">
            <h4
              class="text-sm font-black text-slate-900"
              :class="task.isCompleted ? 'line-through text-slate-400' : ''"
            >
              {{ task.title }}
            </h4>
            <p v-if="task.locationArea" class="text-xs font-bold text-brand-blue">
              الموقع: {{ task.locationArea }}
            </p>
            <p v-if="task.description" class="text-xs text-slate-500 font-medium">
              {{ task.description }}
            </p>
          </div>

          <!-- Complete Button -->
          <button
            @click="completeTask(task.id)"
            :disabled="task.isCompleted"
            class="p-3.5 rounded-2xl flex-shrink-0 transition-all cursor-pointer touch-target-48"
            :class="task.isCompleted ? 'bg-emerald-100 text-emerald-700 cursor-default' : 'bg-slate-100 text-slate-500 hover:bg-emerald-500 hover:text-white'"
          >
            <Check class="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAttendanceStore } from '../../stores/attendance.store';
import { useTaskStore } from '../../stores/task.store';
import { Fingerprint, ListTodo, Check } from 'lucide-vue-next';

const attendanceStore = useAttendanceStore();
const taskStore = useTaskStore();

onMounted(() => {
  attendanceStore.fetchTodayStatus();
  taskStore.fetchMyTasks();
});

const completedCount = computed(() => taskStore.tasks.filter(t => t.isCompleted).length);

function completeTask(id: number) {
  taskStore.completeTask(id);
}

function formatTime(t?: string | null) {
  if (!t) return '--:--';
  return new Date(t).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}
</script>
