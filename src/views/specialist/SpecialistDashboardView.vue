<template>
  <div class="space-y-5 pb-8">
    <!-- Offline Queue Notice Banner -->
    <div
      v-if="therapyStore.offlineQueue.length > 0"
      class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-900"
    >
      <div class="flex items-center gap-3">
        <WifiOff class="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div>
          <p class="text-xs font-bold">
            يوجد {{ therapyStore.offlineQueue.length }} جلسة مسجلة أوفلاين بانتظار المزامنة
          </p>
          <p class="text-[11px] text-amber-700">ستتم المزامنة تلقائياً عند الاتصال بالإنترنت</p>
        </div>
      </div>
      <button
        @click="therapyStore.flushOfflineQueue"
        :disabled="therapyStore.isSyncing"
        class="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors flex items-center gap-1 cursor-pointer"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="therapyStore.isSyncing ? 'animate-spin' : ''" />
        <span>مزامنة</span>
      </button>
    </div>

    <!-- Specialist Shift & Schedule Overview Banner -->
    <div class="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
            <Calendar class="w-4 h-4" />
          </div>
          <div>
            <div class="text-[11px] font-bold text-slate-400">وردية عمل الأخصائي</div>
            <div class="text-xs font-black text-slate-800">
              {{ scheduleStore.shift?.shiftName || 'الفترة الصباحية' }}
              <span v-if="scheduleStore.shift?.startTime" class="text-[10px] text-slate-500 font-bold mr-1">
                ({{ scheduleStore.shift.startTime }} - {{ scheduleStore.shift.endTime }})
              </span>
            </div>
          </div>
        </div>

        <span class="text-xs font-black px-3 py-1 rounded-xl bg-slate-100 text-slate-700">
          {{ scheduleStore.dayName || 'اليوم' }}
        </span>
      </div>

      <!-- Morning vs Evening Quick Counters Grid -->
      <div class="grid grid-cols-2 gap-2 pt-1">
        <!-- Morning Shift Summary Pill -->
        <div
          class="p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between"
          :class="scheduleStore.selectedShiftFilter === 'MORNING' ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20' : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100/70'"
          @click="scheduleStore.selectedShiftFilter = scheduleStore.selectedShiftFilter === 'MORNING' ? 'ALL' : 'MORNING'"
        >
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center flex-shrink-0">
              <Sun class="w-3.5 h-3.5" />
            </div>
            <div>
              <div class="text-[10px] font-bold text-slate-400">الفترة الصباحية</div>
              <div class="text-xs font-black text-slate-800">08:30 - 13:30</div>
            </div>
          </div>
          <div class="text-left">
            <span class="text-xs font-black text-blue-700">{{ scheduleStore.morningCompletedCount }}/{{ scheduleStore.morningSessionsCount }}</span>
            <div class="text-[9px] font-semibold text-slate-400">مكتملة</div>
          </div>
        </div>

        <!-- Evening Shift Summary Pill -->
        <div
          class="p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between"
          :class="scheduleStore.selectedShiftFilter === 'EVENING' ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20' : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100/70'"
          @click="scheduleStore.selectedShiftFilter = scheduleStore.selectedShiftFilter === 'EVENING' ? 'ALL' : 'EVENING'"
        >
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Moon class="w-3.5 h-3.5" />
            </div>
            <div>
              <div class="text-[10px] font-bold text-slate-400">الفترة المسائية</div>
              <div class="text-xs font-black text-slate-800">14:00 - 19:00</div>
            </div>
          </div>
          <div class="text-left">
            <span class="text-xs font-black text-amber-700">{{ scheduleStore.eveningCompletedCount }}/{{ scheduleStore.eveningSessionsCount }}</span>
            <div class="text-[9px] font-semibold text-slate-400">مكتملة</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Session Hero Card (Morning / Break / Evening Shift Support) -->
    <div
      class="rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300"
      :class="
        scheduleStore.activeSessionContext.shiftType === 'EVENING'
          ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-amber-950 text-white border border-amber-500/30 shadow-amber-950/30'
          : 'bg-gradient-to-br from-blue-700 via-indigo-700 to-indigo-900 text-white border border-blue-400/20 shadow-indigo-900/20'
      "
    >
      <div class="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

      <!-- Top Status & Shift Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <!-- Dynamic Pulsing / State Dot -->
          <span
            v-if="scheduleStore.activeSessionContext.state === 'CURRENTLY_RUNNING'"
            class="relative flex h-2.5 w-2.5"
          >
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span
            v-else-if="scheduleStore.activeSessionContext.state === 'BREAK_BETWEEN_SHIFTS'"
            class="w-2.5 h-2.5 rounded-full bg-amber-400"
          ></span>
          <span
            v-else-if="scheduleStore.activeSessionContext.state === 'COMPLETED'"
            class="w-2.5 h-2.5 rounded-full bg-emerald-400"
          ></span>
          <span
            v-else
            class="w-2.5 h-2.5 rounded-full bg-blue-300"
          ></span>

          <!-- Dynamic State Label -->
          <span class="text-xs font-black uppercase tracking-wider text-blue-100">
            {{ scheduleStore.activeSessionContext.label }}
          </span>

          <!-- Remaining Minutes Pill -->
          <span
            v-if="scheduleStore.activeSessionContext.minutesRemaining"
            class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white"
          >
            {{ scheduleStore.activeSessionContext.state === 'CURRENTLY_RUNNING' ? `متبقي ${scheduleStore.activeSessionContext.minutesRemaining} د` : `خلال ${scheduleStore.activeSessionContext.minutesRemaining} د` }}
          </span>

          <!-- Shift Badge -->
          <span
            v-if="scheduleStore.activeSessionContext.shiftType"
            class="px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1"
            :class="
              scheduleStore.activeSessionContext.shiftType === 'EVENING'
                ? 'bg-amber-400/20 text-amber-200 border border-amber-300/30'
                : 'bg-blue-400/20 text-blue-100 border border-blue-300/30'
            "
          >
            <Moon v-if="scheduleStore.activeSessionContext.shiftType === 'EVENING'" class="w-3 h-3 text-amber-300" />
            <Sun v-else class="w-3 h-3 text-amber-300" />
            <span>{{ scheduleStore.activeSessionContext.shiftLabel }}</span>
          </span>
        </div>

        <!-- Time Slot Badge -->
        <span
          v-if="scheduleStore.activeSessionContext.timeSlot"
          class="px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-white border border-white/20"
        >
          {{ scheduleStore.activeSessionContext.timeSlot }}
        </span>
      </div>

      <!-- Inter-shift break banner -->
      <div
        v-if="scheduleStore.activeSessionContext.state === 'BREAK_BETWEEN_SHIFTS'"
        class="mb-4 p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center gap-2 text-xs text-amber-100 font-bold"
      >
        <Coffee class="w-4 h-4 text-amber-300 flex-shrink-0" />
        <span>استراحة الظهيرة بين الورديتين (13:30 - 14:00) • أولى الجلسات المسائية تبدأ 14:00</span>
      </div>

      <!-- Child Information in Active/Upcoming Session -->
      <div v-if="scheduleStore.activeSessionContext.session" class="flex items-center gap-4 mb-6">
        <div class="w-16 h-16 rounded-2xl bg-white/20 p-1 flex-shrink-0 overflow-hidden border border-white/30 shadow-inner">
          <img
            v-if="scheduleStore.activeSessionContext.session.child?.formalPersonalPhoto"
            :src="getPhotoUrl(scheduleStore.activeSessionContext.session.child.formalPersonalPhoto)"
            alt="Child"
            class="w-full h-full object-cover rounded-xl"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-xl font-black text-white">
            {{ scheduleStore.activeSessionContext.session.child?.name?.[0] || 'ط' }}
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-black text-white truncate">
              {{ scheduleStore.activeSessionContext.session.child?.name }}
            </h2>
            <span
              class="text-[10px] px-2 py-0.5 rounded-md font-bold"
              :class="scheduleStore.activeSessionContext.session.shiftType === 'EVENING' ? 'bg-amber-500/30 text-amber-100 border border-amber-400/30' : 'bg-white/20 text-white border border-white/20'"
            >
              فترة {{ scheduleStore.activeSessionContext.session.part }} ({{ scheduleStore.activeSessionContext.session.shiftLabel }})
            </span>
          </div>
          <p class="text-xs text-blue-100/90 font-semibold truncate mt-0.5">
            {{ scheduleStore.activeSessionContext.session.subject || 'جلسة تأهيل وتنمية مهارات' }} • {{ scheduleStore.activeSessionContext.session.child?.category || 'قسم التأهيل' }}
          </p>
        </div>
      </div>

      <!-- State when no active session running or shift not started yet -->
      <div v-else class="py-4 px-1 space-y-3">
        <div class="flex items-start gap-3.5">
          <div
            class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner"
            :class="
              scheduleStore.activeSessionContext.state === 'COMPLETED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                : (scheduleStore.activeSessionContext.shiftType === 'EVENING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  : 'bg-white/20 text-blue-200 border border-white/20')
            "
          >
            <CheckCircle v-if="scheduleStore.activeSessionContext.state === 'COMPLETED'" class="w-6 h-6" />
            <Moon v-else-if="scheduleStore.activeSessionContext.shiftType === 'EVENING'" class="w-6 h-6" />
            <Sun v-else class="w-6 h-6" />
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="text-base font-black text-white">
              {{ scheduleStore.activeSessionContext.label }}
            </h3>
            <p v-if="scheduleStore.activeSessionContext.description" class="text-xs text-blue-100/90 font-semibold mt-1 leading-relaxed">
              {{ scheduleStore.activeSessionContext.description }}
            </p>
          </div>
        </div>

        <!-- Quick filter switch button if evening specialist during morning hours -->
        <div
          v-if="scheduleStore.activeSessionContext.state === 'SHIFT_NOT_STARTED' && scheduleStore.eveningSessionsCount > 0"
          class="pt-1 flex items-center gap-2"
        >
          <button
            @click="scheduleStore.selectedShiftFilter = 'EVENING'"
            class="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer touch-target-48"
          >
            <Moon class="w-3.5 h-3.5 text-amber-300" />
            <span>عرض جدول الفترة المسائية ({{ scheduleStore.eveningSessionsCount }} جلسات)</span>
          </button>
        </div>
      </div>

      <!-- Session Action Buttons -->
      <div v-if="scheduleStore.activeSessionContext.session" class="flex items-center gap-3">
        <button
          @click="openEvaluationDialog(scheduleStore.activeSessionContext.session)"
          class="flex-1 py-3.5 px-4 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-lg shadow-brand-orange/30 transition-all flex items-center justify-center gap-2 cursor-pointer touch-target-48"
        >
          <CheckCircle class="w-4 h-4" />
          <span>{{ scheduleStore.activeSessionContext.session.isEvaluated ? 'تعديل تقييم الجلسة' : 'رصد أهداف الجلسة (IEP)' }}</span>
        </button>

        <button
          @click="openIncidentDialog(scheduleStore.activeSessionContext.session.child?.id)"
          class="py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-rose-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-target-48"
          title="تسجيل عارض أو حادث سلوكي"
        >
          <AlertTriangle class="w-4 h-4 text-rose-300" />
          <span>عارض سلوكي</span>
        </button>
      </div>
    </div>

    <!-- Shift Filter Tabs & Header -->
    <div class="space-y-3">
      <div class="flex items-center justify-between px-1">
        <div>
          <h3 class="text-base font-black text-slate-900">جدول الجلسات</h3>
          <p class="text-xs font-semibold text-slate-400">
            إنجاز {{ scheduleStore.completedSessions }} من {{ scheduleStore.totalSessions }} جلسة
          </p>
        </div>

        <!-- Shift Segmented Control -->
        <div class="flex items-center bg-slate-100 p-1 rounded-2xl gap-1">
          <button
            @click="scheduleStore.selectedShiftFilter = 'ALL'"
            class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer"
            :class="scheduleStore.selectedShiftFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'"
          >
            الكل ({{ scheduleStore.totalSessions }})
          </button>
          <button
            @click="scheduleStore.selectedShiftFilter = 'MORNING'"
            class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            :class="scheduleStore.selectedShiftFilter === 'MORNING' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'"
          >
            <Sun class="w-3 h-3" />
            <span>الصباحي ({{ scheduleStore.morningSessionsCount }})</span>
          </button>
          <button
            @click="scheduleStore.selectedShiftFilter = 'EVENING'"
            class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            :class="scheduleStore.selectedShiftFilter === 'EVENING' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'"
          >
            <Moon class="w-3 h-3" />
            <span>المسائي ({{ scheduleStore.eveningSessionsCount }})</span>
          </button>
        </div>
      </div>

      <!-- Sessions Timeline List -->
      <div v-if="scheduleStore.filteredSessions.length > 0" class="space-y-2.5">
        <div
          v-for="session in scheduleStore.filteredSessions"
          :key="session.id"
          class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-4 transition-all hover:border-slate-300"
        >
          <div class="flex items-center gap-3 min-w-0">
            <!-- Part & Shift Badge -->
            <div
              class="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border"
              :class="session.shiftType === 'EVENING' ? 'bg-amber-50/60 border-amber-100 text-amber-800' : 'bg-blue-50/60 border-blue-100 text-blue-800'"
            >
              <span class="text-[9px] font-bold" :class="session.shiftType === 'EVENING' ? 'text-amber-600' : 'text-blue-600'">
                {{ session.shiftType === 'EVENING' ? 'مسائي' : 'صباحي' }}
              </span>
              <span class="text-sm font-black">{{ session.part }}</span>
            </div>

            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-black text-slate-900 truncate">
                  {{ session.child?.name }}
                </h4>
                <span
                  class="px-1.5 py-0.2 rounded text-[9px] font-bold"
                  :class="session.shiftType === 'EVENING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'"
                >
                  {{ session.shiftLabel }}
                </span>
              </div>
              <p class="text-xs font-semibold text-slate-500 truncate mt-0.5">
                {{ session.timeSlot }} • {{ session.subject }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span
              class="px-2.5 py-1 rounded-lg text-[11px] font-bold"
              :class="session.isEvaluated ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'"
            >
              {{ session.isEvaluated ? 'مكتملة' : 'قادمة' }}
            </span>

            <button
              @click="openEvaluationDialog(session)"
              class="p-2 rounded-xl text-slate-400 hover:text-brand-blue hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <ChevronLeft class="w-5 h-5 rtl-mirror" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State for Selected Filter -->
      <div
        v-else
        class="p-8 rounded-3xl bg-white border border-slate-200/80 text-center space-y-2 shadow-xs"
      >
        <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <Clock class="w-6 h-6" />
        </div>
        <div class="text-sm font-bold text-slate-700">لا توجد جلسات في هذه الفترة اليوم</div>
        <div class="text-xs text-slate-400">
          {{ scheduleStore.selectedShiftFilter === 'MORNING' ? 'لا توجد جلسات صباحية مسندة إليك اليوم' : (scheduleStore.selectedShiftFilter === 'EVENING' ? 'لا توجد جلسات مسائية مسندة إليك اليوم' : 'لا توجد جلسات مسجلة اليوم') }}
        </div>
      </div>
    </div>

    <!-- Session Evaluation Modal -->
    <SessionEvaluateDialog
      v-if="selectedSessionForEval"
      :session="selectedSessionForEval"
      @close="selectedSessionForEval = null"
      @saved="onEvaluationSaved"
    />

    <!-- Incident Dialog -->
    <IncidentReportDialog
      v-if="incidentChildId"
      :child-id="incidentChildId"
      @close="incidentChildId = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useScheduleStore, type TodaySession } from '../../stores/schedule.store';
import { useTherapyStore } from '../../stores/therapy.store';
import SessionEvaluateDialog from './components/SessionEvaluateDialog.vue';
import IncidentReportDialog from './components/IncidentReportDialog.vue';
import {
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  Sun,
  Moon,
  Calendar,
  Clock,
  Coffee,
} from 'lucide-vue-next';

const scheduleStore = useScheduleStore();
const therapyStore = useTherapyStore();

const selectedSessionForEval = ref<TodaySession | null>(null);
const incidentChildId = ref<number | null>(null);

onMounted(() => {
  scheduleStore.fetchTodaySchedule();
});

function getPhotoUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `http://localhost:3010/${path.replace(/^\/+/, '')}`;
}

function openEvaluationDialog(session: TodaySession) {
  selectedSessionForEval.value = session;
}

function openIncidentDialog(childId?: number) {
  if (childId) incidentChildId.value = childId;
}

function onEvaluationSaved(scheduleId: number) {
  scheduleStore.markSessionEvaluated(scheduleId);
  selectedSessionForEval.value = null;
}
</script>
