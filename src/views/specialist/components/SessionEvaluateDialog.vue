<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans" dir="rtl">
    <div class="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 class="text-base font-black text-slate-900">
            رصد وتقييم الجلسة الفردية
          </h3>
          <p class="text-xs font-semibold text-slate-500">
            الطفل: {{ session.child?.name }} • فترة {{ session.part }}
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      <!-- Scrollable Form Body -->
      <div class="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
        <!-- IEP Goals Rating Checklist -->
        <div>
          <label class="block text-xs font-extrabold text-slate-700 mb-2">
            مستوى إنجاز أهداف الخطة الفردية (IEP Goals)
          </label>
          <div class="space-y-2.5">
            <div
              v-for="goal in goalsList"
              :key="goal.id"
              class="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2"
            >
              <div class="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>{{ goal.title }}</span>
                <span class="text-[10px] text-brand-blue font-extrabold">{{ goal.level }}</span>
              </div>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  v-for="opt in goalOptions"
                  :key="opt.value"
                  @click="goal.level = opt.label"
                  class="py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer"
                  :class="goal.level === opt.label ? 'bg-brand-blue text-white border-brand-blue shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Behavior Notes -->
        <div>
          <label class="block text-xs font-extrabold text-slate-700 mb-1.5">
            ملاحظات السلوك والانتباه
          </label>
          <textarea
            v-model="behaviorNotes"
            rows="2"
            placeholder="مثال: استجابة ممتازة، تواصل بصري مستمر، بعض التشتت في الدقائق الأخيرة..."
            class="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          ></textarea>
        </div>

        <!-- Sensory Notes -->
        <div>
          <label class="block text-xs font-extrabold text-slate-700 mb-1.5">
            ملاحظات التكامل الحسي والجسدي
          </label>
          <textarea
            v-model="sensoryNotes"
            rows="2"
            placeholder="مثال: تفاعل ممتاز مع الملمس الناعم، حاجة لمزيد من التوازن الحركي..."
            class="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          ></textarea>
        </div>

        <!-- Overall Score (1 to 5 Stars) -->
        <div>
          <label class="block text-xs font-extrabold text-slate-700 mb-1.5">
            التقييم العام لأداء الطفل في الجلسة
          </label>
          <div class="flex items-center gap-2">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              @click="overallScore = star"
              class="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer"
              :class="star <= overallScore ? 'bg-amber-100 text-amber-500 scale-105' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'"
            >
              ★
            </button>
            <span class="text-xs font-bold text-slate-600 mr-2">{{ overallScore }} من 5 نجوم</span>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
        <q-btn
          flat
          no-caps
          label="إلغاء"
          color="grey-8"
          @click="$emit('close')"
          class="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700"
        />
        <q-btn
          unelevated
          no-caps
          label="اعتماد وتوثيق الجلسة"
          color="primary"
          :loading="isSubmitting"
          @click="submitEvaluation"
          class="flex-2 py-2.5 rounded-xl font-black text-xs shadow-md"
          style="background-color: #313C8E !important; color: #ffffff !important;"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTherapyStore } from '../../../stores/therapy.store';
import type { TodaySession } from '../../../stores/schedule.store';

const props = defineProps<{
  session: TodaySession;
}>();

const emit = defineEmits(['close', 'saved']);
const therapyStore = useTherapyStore();

const isSubmitting = ref(false);
const behaviorNotes = ref('');
const sensoryNotes = ref('');
const overallScore = ref(4);

const goalOptions = [
  { label: 'استقلالية', value: 'INDEPENDENT' },
  { label: 'مساعدة لفظية', value: 'VERBAL_PROMPT' },
  { label: 'مساعدة جسدية', value: 'PHYSICAL_PROMPT' },
];

const goalsList = ref([
  { id: 1, title: 'التواصل البصري مع الأخصائي لأكثر من 5 ثوانٍ', level: 'استقلالية' },
  { id: 2, title: 'إتمام مطابقة الألوان والأشكال الهندسية', level: 'مساعدة لفظية' },
  { id: 3, title: 'الاستجابة لنداء الاسم والترحيب باليد', level: 'استقلالية' },
]);

async function submitEvaluation() {
  isSubmitting.value = true;
  const payload = {
    childId: props.session.child.id,
    scheduleId: props.session.id,
    part: props.session.part,
    goalsProgressJson: JSON.stringify(goalsList.value),
    behaviorNotes: behaviorNotes.value,
    sensoryNotes: sensoryNotes.value,
    overallScore: overallScore.value,
  };

  const res = await therapyStore.evaluateSession(payload);
  isSubmitting.value = false;

  if (res.success) {
    emit('saved', props.session.id);
  }
}
</script>
