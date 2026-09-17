import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '../api/client';

export interface TodaySession {
  id: number;
  part: number;
  shiftType: 'MORNING' | 'EVENING';
  shiftLabel: string;
  timeSlot: string;
  subject: string;
  isEvaluated: boolean;
  child: {
    id: number;
    name: string;
    formalPersonalPhoto?: string;
    category?: string;
    section?: string;
    age?: number;
  };
}

export interface ActiveSessionContext {
  session: TodaySession | null;
  state: 'CURRENTLY_RUNNING' | 'UPCOMING' | 'COMPLETED' | 'BREAK_BETWEEN_SHIFTS' | 'SHIFT_NOT_STARTED' | 'NO_SESSIONS';
  label: string;
  description?: string;
  badgeClass: string;
  shiftType: 'MORNING' | 'EVENING' | null;
  shiftLabel: string | null;
  timeSlot: string | null;
  minutesRemaining?: number;
}

export const useScheduleStore = defineStore('schedule', () => {
  const todaySessions = ref<TodaySession[]>([]);
  const dayName = ref<string>('');
  const shift = ref<any>(null);
  const totalSessions = ref(0);
  const completedSessions = ref(0);
  const morningSessionsCount = ref(0);
  const morningCompletedCount = ref(0);
  const eveningSessionsCount = ref(0);
  const eveningCompletedCount = ref(0);
  const selectedShiftFilter = ref<'ALL' | 'MORNING' | 'EVENING'>('ALL');
  const isLoading = ref(false);

  // Computed filtered sessions based on active shift filter
  const filteredSessions = computed(() => {
    if (selectedShiftFilter.value === 'MORNING') {
      return todaySessions.value.filter(s => s.shiftType === 'MORNING');
    }
    if (selectedShiftFilter.value === 'EVENING') {
      return todaySessions.value.filter(s => s.shiftType === 'EVENING');
    }
    return todaySessions.value;
  });

  // Morning sessions (parts 1 - 10: 08:30 - 13:30)
  const morningSessions = computed(() => todaySessions.value.filter(s => s.shiftType === 'MORNING'));
  // Evening sessions (parts 11 - 20: 14:00 - 19:00)
  const eveningSessions = computed(() => todaySessions.value.filter(s => s.shiftType === 'EVENING'));

  // Active session context with strict real-time shift awareness
  const activeSessionContext = computed<ActiveSessionContext>(() => {
    if (todaySessions.value.length === 0) {
      return {
        session: null,
        state: 'NO_SESSIONS',
        label: 'لا توجد جلسات مسجلة لليوم',
        description: 'ليس لديك أي جلسات تأهيل مجدولة في جدول اليوم.',
        badgeClass: 'bg-slate-100 text-slate-500',
        shiftType: null,
        shiftLabel: null,
        timeSlot: null,
      };
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const isMorningWindow = currentMinutes >= 510 && currentMinutes < 810; // 08:30 to 13:30
    const isBreakWindow = currentMinutes >= 810 && currentMinutes < 840; // 13:30 to 14:00
    const isEveningWindow = currentMinutes >= 840 && currentMinutes < 1140; // 14:00 to 19:00
    const isAfterHours = currentMinutes >= 1140; // 19:00+ (Center Closed)
    const isBeforeHours = currentMinutes < 510; // Before 08:30 (Center Not Opened Yet)

    const hasMorningSessions = morningSessions.value.length > 0;
    const hasEveningSessions = eveningSessions.value.length > 0;
    const uncompletedCount = todaySessions.value.filter(s => !s.isEvaluated).length;

    // 1. Strict Running Session Check: ONLY active if clock is strictly within startMin and endMin
    for (const session of todaySessions.value) {
      let startMin = 0;
      if (session.part <= 10) {
        startMin = 8 * 60 + 30 + (session.part - 1) * 30;
      } else {
        startMin = 14 * 60 + (session.part - 11) * 30;
      }
      const endMin = startMin + 30;

      if (currentMinutes >= startMin && currentMinutes < endMin) {
        return {
          session,
          state: 'CURRENTLY_RUNNING',
          label: 'الجلسة الجارية الآن',
          description: `جلسة جارية حالياً تنتهي في تمام ${session.timeSlot.split(' - ')[1]}`,
          badgeClass: 'bg-emerald-500 text-white animate-pulse',
          shiftType: session.shiftType,
          shiftLabel: session.shiftLabel,
          timeSlot: session.timeSlot,
          minutesRemaining: endMin - currentMinutes,
        };
      }
    }

    // 2. Handle AFTER HOURS (19:00+ / Night Time) -> Shift is ended, NO session can be active or upcoming!
    if (isAfterHours) {
      return {
        session: null,
        state: 'COMPLETED',
        label: 'انتهت ساعات دوام المركز لليوم',
        description: uncompletedCount > 0
          ? `انتهى دوام المركز لليوم (19:00). لديك ${uncompletedCount} جلسة بانتظار استكمال التقييم في جدول الجلسات أدناه.`
          : 'أحسنت عملاً! تم استكمال وتوثيق كافة الجلسات المجدولة لليوم بنجاح.',
        badgeClass: 'bg-slate-800 text-amber-200 border border-amber-500/30',
        shiftType: 'EVENING',
        shiftLabel: 'الفترة المسائية',
        timeSlot: null,
      };
    }

    // 3. Handle BEFORE HOURS (< 08:30 AM)
    if (isBeforeHours) {
      if (hasMorningSessions) {
        const firstMorning = morningSessions.value[0];
        return {
          session: firstMorning,
          state: 'UPCOMING',
          label: 'أولى جلسات اليوم (تبدأ 08:30)',
          description: `تبدأ الجلسة الصباحية الأولى في تمام الساعة 08:30 (خلال ${510 - currentMinutes} دقيقة)`,
          badgeClass: 'bg-blue-500 text-white',
          shiftType: 'MORNING',
          shiftLabel: 'الفترة الصباحية',
          timeSlot: firstMorning.timeSlot,
          minutesRemaining: 510 - currentMinutes,
        };
      } else {
        return {
          session: null,
          state: 'SHIFT_NOT_STARTED',
          label: 'وردية عملك مسائية تبدأ الساعة 14:00',
          description: `لا توجد جلسات صباحية مسندة إليك اليوم • لديك ${eveningSessions.value.length} جلسات مسائية مجدولة.`,
          badgeClass: 'bg-amber-400/20 text-amber-200 border border-amber-300/30',
          shiftType: 'EVENING',
          shiftLabel: 'الفترة المسائية',
          timeSlot: null,
        };
      }
    }

    // 4. Handle Filter Overrides if user clicked an explicit tab
    if (selectedShiftFilter.value === 'MORNING' && (isBreakWindow || isEveningWindow)) {
      return {
        session: null,
        state: 'COMPLETED',
        label: 'أرشيف جلسات الفترة الصباحية لليوم',
        description: 'انتهت الفترة الصباحية (08:30 - 13:30). يمكنك استعراض الجلسات أو رصدها من الجدول أدناه.',
        badgeClass: 'bg-blue-400/20 text-blue-100 border border-blue-300/30',
        shiftType: 'MORNING',
        shiftLabel: 'الفترة الصباحية',
        timeSlot: null,
      };
    }

    if (selectedShiftFilter.value === 'EVENING' && isMorningWindow) {
      return {
        session: null,
        state: 'SHIFT_NOT_STARTED',
        label: 'معاينة جدول الفترة المسائية (تبدأ 14:00)',
        description: `تبدأ الجلسات المسائية في تمام الساعة 14:00 (لديك ${eveningSessions.value.length} جلسات مسائية مجدولة).`,
        badgeClass: 'bg-amber-400/20 text-amber-200 border border-amber-300/30',
        shiftType: 'EVENING',
        shiftLabel: 'الفترة المسائية',
        timeSlot: null,
      };
    }

    // 5. Handle MORNING WINDOW (08:30 to 13:30)
    if (isMorningWindow) {
      if (!hasMorningSessions) {
        return {
          session: null,
          state: 'SHIFT_NOT_STARTED',
          label: 'لا توجد جلسات في الفترة الصباحية',
          description: `وردية عملك مسائية تبدأ الساعة 14:00 • لديك ${eveningSessions.value.length} جلسات مسائية مجدولة.`,
          badgeClass: 'bg-amber-400/20 text-amber-200 border border-amber-300/30',
          shiftType: 'EVENING',
          shiftLabel: 'الفترة المسائية',
          timeSlot: null,
        };
      }

      // Check upcoming morning sessions
      for (const session of morningSessions.value) {
        const startMin = 8 * 60 + 30 + (session.part - 1) * 30;
        if (startMin > currentMinutes) {
          return {
            session,
            state: 'UPCOMING',
            label: 'الجلسة الصباحية القادمة',
            description: `تبدأ الجلسة القادمة في تمام ${session.timeSlot.split(' - ')[0]} (خلال ${startMin - currentMinutes} دقيقة)`,
            badgeClass: 'bg-blue-500 text-white',
            shiftType: 'MORNING',
            shiftLabel: 'الفترة الصباحية',
            timeSlot: session.timeSlot,
            minutesRemaining: startMin - currentMinutes,
          };
        }
      }

      // All scheduled morning sessions have ended: session must be null!
      return {
        session: null,
        state: 'COMPLETED',
        label: hasEveningSessions ? 'اكتملت جلسات الفترة الصباحية' : 'تم إنجاز كافة جلسات اليوم بنجاح',
        description: hasEveningSessions
          ? `أحسنت! انتهت جلسات الفترة الصباحية • تبدأ الفترة المسائية الساعة 14:00`
          : 'أحسنت عملاً! تم استكمال الجلسات الصباحية لليوم بنجاح.',
        badgeClass: 'bg-emerald-500 text-white',
        shiftType: 'MORNING',
        shiftLabel: 'الفترة الصباحية',
        timeSlot: null,
      };
    }

    // 6. Handle BREAK WINDOW (13:30 to 14:00)
    if (isBreakWindow) {
      if (!hasEveningSessions) {
        return {
          session: null,
          state: 'COMPLETED',
          label: 'انتهت ساعات العمل المقررة لليوم',
          description: 'انتهت الفترة الصباحية ولا توجد جلسات مسائية مقررة لك. شكراً لجهودك!',
          badgeClass: 'bg-emerald-500 text-white',
          shiftType: 'MORNING',
          shiftLabel: 'الفترة الصباحية',
          timeSlot: null,
        };
      }

      return {
        session: null,
        state: 'BREAK_BETWEEN_SHIFTS',
        label: 'فترة استراحة الظهيرة (13:30 - 14:00)',
        description: `استراحة بين الورديتين • تبدأ أولى الجلسات المسائية الساعة 14:00 (خلال ${840 - currentMinutes} دقيقة)`,
        badgeClass: 'bg-amber-400 text-slate-950',
        shiftType: 'EVENING',
        shiftLabel: 'الفترة المسائية',
        timeSlot: null,
        minutesRemaining: 840 - currentMinutes,
      };
    }

    // 7. Handle EVENING WINDOW (14:00 to 19:00)
    if (isEveningWindow) {
      if (!hasEveningSessions) {
        // Morning specialist in evening hours: DO NOT SHOW MORNING SESSION!
        return {
          session: null,
          state: 'COMPLETED',
          label: 'انتهى دوامك الصباحي لليوم',
          description: 'لا توجد جلسات مسائية مسندة إليك اليوم. تم انتهاء ساعات عملك لليوم بنجاح.',
          badgeClass: 'bg-amber-400/20 text-amber-200 border border-amber-300/30',
          shiftType: 'EVENING',
          shiftLabel: 'الفترة المسائية',
          timeSlot: null,
        };
      }

      // Check upcoming evening sessions
      for (const session of eveningSessions.value) {
        const startMin = 14 * 60 + (session.part - 11) * 30;
        if (startMin > currentMinutes) {
          return {
            session,
            state: 'UPCOMING',
            label: 'الجلسة المسائية القادمة',
            description: `تبدأ الجلسة القادمة في تمام ${session.timeSlot.split(' - ')[0]} (خلال ${startMin - currentMinutes} دقيقة)`,
            badgeClass: 'bg-amber-500 text-slate-950',
            shiftType: 'EVENING',
            shiftLabel: 'الفترة المسائية',
            timeSlot: session.timeSlot,
            minutesRemaining: startMin - currentMinutes,
          };
        }
      }

      // All scheduled evening sessions have ended: session must be null!
      return {
        session: null,
        state: 'COMPLETED',
        label: 'تم إنجاز كافة جلسات الفترة المسائية بنجاح',
        description: 'أحسنت عملاً! انتهت جميع الجلسات المسائية المقررة لليوم.',
        badgeClass: 'bg-emerald-500 text-white',
        shiftType: 'EVENING',
        shiftLabel: 'الفترة المسائية',
        timeSlot: null,
      };
    }

    // Fallback: safe completed state with null session
    return {
      session: null,
      state: 'COMPLETED',
      label: 'تم إنجاز كافة الجلسات المقررة لليوم',
      description: 'تم استكمال كافة الجلسات المجدولة لليوم.',
      badgeClass: 'bg-emerald-600 text-white',
      shiftType: null,
      shiftLabel: null,
      timeSlot: null,
    };
  });

  const activeSession = computed<TodaySession | null>(() => activeSessionContext.value.session);

  async function fetchTodaySchedule() {
    isLoading.value = true;
    try {
      const res = await apiClient.get('/therapy/today-schedule');
      if (res.data.status && res.data.data) {
        const d = res.data.data;
        todaySessions.value = d.sessions || [];
        dayName.value = d.day || '';
        shift.value = d.shift || null;
        totalSessions.value = d.totalSessions || 0;
        completedSessions.value = d.completedSessions || 0;
        morningSessionsCount.value = d.morningSessionsCount || 0;
        morningCompletedCount.value = d.morningCompletedCount || 0;
        eveningSessionsCount.value = d.eveningSessionsCount || 0;
        eveningCompletedCount.value = d.eveningCompletedCount || 0;
      }
    } catch (e) {
      console.warn('Failed to load schedule:', e);
    } finally {
      isLoading.value = false;
    }
  }

  function markSessionEvaluated(scheduleId: number) {
    const s = todaySessions.value.find(item => item.id === scheduleId);
    if (s && !s.isEvaluated) {
      s.isEvaluated = true;
      completedSessions.value++;
      if (s.shiftType === 'MORNING') morningCompletedCount.value++;
      if (s.shiftType === 'EVENING') eveningCompletedCount.value++;
    }
  }

  return {
    todaySessions,
    filteredSessions,
    morningSessions,
    eveningSessions,
    selectedShiftFilter,
    dayName,
    shift,
    totalSessions,
    completedSessions,
    morningSessionsCount,
    morningCompletedCount,
    eveningSessionsCount,
    eveningCompletedCount,
    isLoading,
    activeSession,
    activeSessionContext,
    fetchTodaySchedule,
    markSessionEvaluated,
  };
});
