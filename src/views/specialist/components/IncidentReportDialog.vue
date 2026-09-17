<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans" dir="rtl">
    <div class="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="p-5 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertTriangle class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-black text-rose-900">
              تقرير عارض أو حادث سلوكي
            </h3>
            <p class="text-[11px] font-semibold text-rose-600">
              إشعار فوري لإدارة المركز وتوثيق السجل
            </p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      <!-- Form Body -->
      <div class="p-5 space-y-4">
        <div>
          <label class="block text-xs font-extrabold text-slate-700 mb-1.5">
            نوع العارض / الحادث
          </label>
          <select
            v-model="incidentType"
            class="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          >
            <option value="BEHAVIORAL">نوبة غضب أو سلوك عنيف</option>
            <option value="HEALTH">عارض صحي مفاجئ / إعياء</option>
            <option value="INJURY">سقوط أو إصابة طفيفة</option>
            <option value="OTHER">أخرى</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-extrabold text-slate-700 mb-1.5">
            مستوى الخطورة
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              v-for="s in severities"
              :key="s.value"
              @click="severity = s.value"
              class="py-2 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer"
              :class="severity === s.value ? s.activeClass : 'bg-white text-slate-600 border-slate-200'"
            >
              {{ s.label }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-extrabold text-slate-700 mb-1.5">
            تفاصيل وتوصيف ما حدث
          </label>
          <textarea
            v-model="description"
            rows="3"
            placeholder="اشرح بدقة ما حدث أثناء الجلسة..."
            class="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          ></textarea>
        </div>

        <div>
          <label class="block text-xs font-extrabold text-slate-700 mb-1.5">
            الإجراء المتخذ فوراً
          </label>
          <input
            v-model="actionTaken"
            type="text"
            placeholder="مثال: تم تهدئة الطفل وعزله في الركن الحسي..."
            class="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
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
          label="إرسال التقرير فوراً"
          color="negative"
          :loading="isSubmitting"
          :disabled="!description"
          @click="submitIncident"
          class="flex-2 py-2.5 rounded-xl font-black text-xs shadow-md"
          style="background-color: #E11D48 !important; color: #ffffff !important;"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTherapyStore } from '../../../stores/therapy.store';
import { AlertTriangle } from 'lucide-vue-next';

const props = defineProps<{
  childId: number;
}>();

const emit = defineEmits(['close']);
const therapyStore = useTherapyStore();

const isSubmitting = ref(false);
const incidentType = ref('BEHAVIORAL');
const severity = ref('MEDIUM');
const description = ref('');
const actionTaken = ref('');

const severities = [
  { label: 'بسيط', value: 'LOW', activeClass: 'bg-blue-600 text-white border-blue-600' },
  { label: 'متوسط', value: 'MEDIUM', activeClass: 'bg-amber-500 text-white border-amber-500' },
  { label: 'حرج / طارئ', value: 'HIGH', activeClass: 'bg-rose-600 text-white border-rose-600' },
];

async function submitIncident() {
  if (!description.value) return;
  isSubmitting.value = true;
  await therapyStore.reportIncident(
    props.childId,
    incidentType.value,
    description.value,
    severity.value,
    actionTaken.value
  );
  isSubmitting.value = false;
  emit('close');
}
</script>
