<template>
  <div class="space-y-5 pb-28">
    <!-- Top Bar: Navigation & Auto-Save Status -->
    <div class="flex items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
      <button
        @click="$router.back()"
        class="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowRight class="w-4 h-4 rtl-mirror" />
        <span>العودة لملف الطفل</span>
      </button>

      <div class="flex items-center gap-2">
        <span
          v-if="store.isSavingDraft"
          class="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse flex items-center gap-1"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>جاري الحفظ التلقائي...</span>
        </span>
        <span
          v-else-if="store.lastSavedAt"
          class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1"
        >
          <Check class="w-3 h-3 text-emerald-600" />
          <span>مسودة محفوظة تلقائياً</span>
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.isLoading && !store.currentRecord" class="py-16 text-center space-y-3">
      <q-spinner-dots color="primary" size="40px" />
      <p class="text-xs font-bold text-slate-500">جاري تجهيز بنود المقياس ومحرك الحسابات...</p>
    </div>

    <template v-else-if="store.currentRecord">
      <!-- Test Header Card -->
      <div class="p-5 rounded-3xl bg-gradient-to-r from-brand-navy via-indigo-900 to-[#1E255E] text-white shadow-xl relative overflow-hidden">
        <div class="absolute -left-10 -bottom-10 w-36 h-36 rounded-full bg-white/5 pointer-events-none"></div>
        <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider">
                {{ store.currentRecord.template?.code }}
              </span>
              <span class="text-xs text-sky-200 font-bold">
                الطفل: {{ store.currentRecord.child?.name }} ({{ store.currentRecord.child?.age }} سنوات)
              </span>
            </div>
            <h1 class="text-lg font-black">{{ store.currentRecord.template?.nameAr }}</h1>
            <p class="text-xs text-slate-300 line-clamp-2 max-w-xl">{{ store.currentRecord.template?.description }}</p>
          </div>

          <div class="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center flex-shrink-0 self-stretch sm:self-auto">
            <p class="text-[10px] text-slate-300 font-bold">نسبة الإنجاز</p>
            <p class="text-xl font-black text-amber-300 font-mono">{{ answeredCount }} / {{ totalItemsCount }}</p>
            <p class="text-[10px] text-emerald-300 font-bold">{{ progressPercentage }}% مكتمل</p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mt-4 w-full bg-black/20 rounded-full h-2 overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-300"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Domain / Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          @click="activeDomainFilter = 'ALL'"
          class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer"
          :class="activeDomainFilter === 'ALL'
            ? 'bg-brand-navy text-white shadow-sm'
            : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'"
        >
          كافة البنود ({{ totalItemsCount }})
        </button>

        <button
          v-for="domain in uniqueDomains"
          :key="domain"
          @click="activeDomainFilter = domain"
          class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5"
          :class="activeDomainFilter === domain
            ? 'bg-brand-navy text-white shadow-sm'
            : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'"
        >
          <span>{{ domain }}</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full" :class="activeDomainFilter === domain ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'">
            {{ getDomainAnsweredCount(domain) }} / {{ getDomainTotalCount(domain) }}
          </span>
        </button>
      </div>

      <!-- Items List -->
      <div class="space-y-4">
        <div
          v-for="(item, index) in filteredItems"
          :key="item.code"
          class="p-5 rounded-3xl bg-white border transition-all duration-200 text-right space-y-4 shadow-xs"
          :class="answersMap[item.code] !== undefined ? 'border-emerald-200/90 shadow-sm' : 'border-slate-200/80'"
        >
          <!-- Item Header -->
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-black flex items-center justify-center">
                  {{ getItemIndex(item.code) + 1 }}
                </span>
                <span class="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                  {{ item.domainAr || item.domain }}
                </span>
                <span v-if="item.ageBracket" class="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 text-[10px] font-bold">
                  فئة: {{ item.ageBracket.replace('_', '-') }} سنة
                </span>
              </div>
              <h3 class="text-sm font-black text-slate-900 leading-snug pt-1">
                {{ item.title }}
              </h3>
            </div>

            <!-- Answered Check Icon -->
            <span
              v-if="answersMap[item.code] !== undefined"
              class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0"
            >
              <Check class="w-4 h-4" />
            </span>
          </div>

          <!-- Clinical Tip Callout (Specialist Guidance) -->
          <div
            v-if="item.clinicalTip"
            class="p-3 rounded-2xl bg-sky-50/80 border border-sky-200/70 text-sky-950 flex items-start gap-2.5 text-xs font-medium leading-relaxed"
          >
            <Lightbulb class="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <span class="font-bold text-sky-900">توجيه إكلينيكي للملاحظة: </span>
              <span>{{ item.clinicalTip }}</span>
            </div>
          </div>

          <!-- Rating Options (Big Touch Buttons) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              v-for="opt in item.options"
              :key="opt.value"
              @click="handleSelectScore(item, opt.value, opt.label)"
              class="p-3 rounded-2xl border text-right transition-all flex items-center justify-between gap-2 cursor-pointer touch-target-48"
              :class="answersMap[item.code]?.scoreValue === opt.value
                ? 'bg-brand-navy text-white border-brand-navy shadow-md scale-[1.01]'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'"
            >
              <div class="space-y-0.5">
                <p class="text-xs font-black">{{ opt.label }}</p>
                <p
                  v-if="opt.description"
                  class="text-[11px] leading-tight opacity-80"
                  :class="answersMap[item.code]?.scoreValue === opt.value ? 'text-sky-100' : 'text-slate-500'"
                >
                  {{ opt.description }}
                </p>
              </div>

              <span
                class="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0"
                :class="answersMap[item.code]?.scoreValue === opt.value ? 'border-white bg-white text-brand-navy' : 'border-slate-300 bg-white'"
              >
                <span v-if="answersMap[item.code]?.scoreValue === opt.value" class="w-2.5 h-2.5 rounded-full bg-brand-navy"></span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Clinical Notes & Recommendations Section -->
      <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 text-right">
        <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
          <FileText class="w-4 h-4 text-brand-navy" />
          <span>الملاحظات السريرية والتوصيات الختامية</span>
        </h3>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">الملاحظات السلوكية أثناء الجلسة (اختياري)</label>
          <textarea
            v-model="clinicalNotes"
            rows="2"
            placeholder="مثال: كان الطفل متعاوناً خلال النصف الأول ثم ظهرت علامات التشتت..."
            class="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          ></textarea>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">التوصيات التأهيلية المبدئية (اختياري)</label>
          <textarea
            v-model="recommendations"
            rows="2"
            placeholder="مثال: التركيز على التواصل البصري وجلسات التخاطب مرتين أسبوعياً..."
            class="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          ></textarea>
        </div>
      </div>
    </template>

    <!-- Floating Live Score & Action Footer Bar -->
    <div
      v-if="store.currentRecord && !store.currentRecord.isLocked"
      class="fixed bottom-0 inset-x-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl font-sans"
    >
      <div class="max-w-2xl mx-auto flex items-center justify-between gap-3">
        <!-- Live Calculation Chip -->
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-brand-navy font-black text-sm font-mono shadow-inner">
            {{ currentRawScore.toFixed(1) }}
          </div>
          <div class="truncate">
            <p class="text-[10px] text-slate-400 font-bold">الحساب الآلي اللحظي</p>
            <p class="text-xs font-black text-slate-800 truncate">
              {{ answeredCount === totalItemsCount ? 'جميع البنود مكتملة ✓' : `متبقي ${totalItemsCount - answeredCount} بنداً` }}
            </p>
          </div>
        </div>

        <!-- Buttons with Explicit High Contrast -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <q-btn
            flat
            no-caps
            label="حفظ مسودة"
            :loading="store.isSavingDraft"
            @click="handleManualSaveDraft"
            class="rounded-xl px-3.5 py-2 text-xs font-bold"
            style="background-color: #F1F5F9 !important; color: #334155 !important; font-weight: 700 !important;"
          />

          <q-btn
            unelevated
            no-caps
            label="اعتماد وتوثيق التقييم"
            :loading="store.isLoading"
            :disabled="answeredCount === 0"
            @click="handleConfirmFinalize"
            class="rounded-xl px-4 py-2 text-xs font-black shadow-md"
            style="background-color: #313C8E !important; color: #ffffff !important; font-weight: 800 !important;"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClinicalAssessmentsStore, type AssessmentAnswer } from '../../../stores/clinical-assessments.store';
import { useQuasar } from 'quasar';
import { ArrowRight, Check, FileText, Lightbulb } from 'lucide-vue-next';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const store = useClinicalAssessmentsStore();

const recordId = computed(() => Number(route.params.recordId));
const childId = computed(() => Number(route.params.childId));

const answersMap = ref<Record<string, AssessmentAnswer>>({});
const activeDomainFilter = ref<string>('ALL');
const clinicalNotes = ref('');
const recommendations = ref('');
let autoSaveTimer: any = null;

onMounted(async () => {
  if (recordId.value) {
    const rec = await store.fetchRecord(recordId.value);
    if (rec) {
      clinicalNotes.value = rec.clinicalNotes || '';
      recommendations.value = rec.recommendations || '';

      // Populate existing item scores if any
      if (rec.itemScores && Array.isArray(rec.itemScores)) {
        rec.itemScores.forEach((ans: any) => {
          answersMap.value[ans.itemCode] = {
            itemCode: ans.itemCode,
            domainName: ans.domainName,
            scoreValue: ans.scoreValue,
            scoreLabel: ans.scoreLabel,
            itemAgeBracket: ans.itemAgeBracket,
            clinicalNote: ans.clinicalNote,
          };
        });
      }

      // If already finalized, redirect to report
      if (rec.isLocked || rec.status === 'FINALIZED') {
        router.replace({
          name: 'AssessmentReport',
          params: { childId: childId.value, recordId: recordId.value },
        });
      }
    }
  }

  // Periodic Auto-save every 25 seconds if changes occurred
  autoSaveTimer = setInterval(() => {
    triggerSilentAutoSave();
  }, 25000);
});

onUnmounted(() => {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
});

const templateItems = computed(() => store.currentRecord?.templateItems || []);
const totalItemsCount = computed(() => templateItems.value.length);
const answeredCount = computed(() => Object.keys(answersMap.value).length);
const progressPercentage = computed(() => {
  if (totalItemsCount.value === 0) return 0;
  return Math.round((answeredCount.value / totalItemsCount.value) * 100);
});

const uniqueDomains = computed(() => {
  const set = new Set<string>();
  templateItems.value.forEach((it: any) => set.add(it.domainAr || it.domain));
  return Array.from(set);
});

const filteredItems = computed(() => {
  if (activeDomainFilter.value === 'ALL') return templateItems.value;
  return templateItems.value.filter((it: any) => (it.domainAr || it.domain) === activeDomainFilter.value);
});

function getItemIndex(code: string) {
  return templateItems.value.findIndex((it: any) => it.code === code);
}

function getDomainAnsweredCount(domainName: string) {
  return templateItems.value.filter(
    (it: any) => (it.domainAr || it.domain) === domainName && answersMap.value[it.code] !== undefined,
  ).length;
}

function getDomainTotalCount(domainName: string) {
  return templateItems.value.filter((it: any) => (it.domainAr || it.domain) === domainName).length;
}

const currentRawScore = computed(() => {
  let sum = 0;
  Object.values(answersMap.value).forEach((a) => (sum += Number(a.scoreValue) || 0));
  return sum;
});

function handleSelectScore(item: any, scoreValue: number, scoreLabel: string) {
  answersMap.value[item.code] = {
    itemCode: item.code,
    domainName: item.domainAr || item.domain,
    scoreValue,
    scoreLabel,
    itemAgeBracket: item.ageBracket,
  };
}

async function triggerSilentAutoSave() {
  const answers = Object.values(answersMap.value);
  if (answers.length > 0 && recordId.value) {
    await store.saveDraft(recordId.value, answers, clinicalNotes.value, recommendations.value);
  }
}

async function handleManualSaveDraft() {
  const answers = Object.values(answersMap.value);
  await store.saveDraft(recordId.value, answers, clinicalNotes.value, recommendations.value);
  $q.notify({
    type: 'positive',
    message: 'تم حفظ مسودة التقييم بنجاح',
    position: 'top',
  });
}

function handleConfirmFinalize() {
  const remaining = totalItemsCount.value - answeredCount.value;
  let message = 'هل أنت متأكد من اعتماد نتائج التقييم وقفل الجلسة واستخراج التشخيص الإكلينيكي؟';
  if (remaining > 0) {
    message = `تنبيه: يوجد ${remaining} بنداً غير مجاب. هل تريد اعتماد التقييم بالبنود المكتملة الحالية؟`;
  }

  $q.dialog({
    title: 'تأكيد اعتماد التقييم',
    message,
    cancel: { label: 'مراجعة البنود', flat: true, textColor: 'grey-8' },
    ok: {
      label: 'نعم، اعتماد وقفل',
      color: 'primary',
      textColor: 'white',
      unelevated: true,
      style: 'background-color: #313C8E !important; color: #ffffff !important;',
    },
  }).onOk(async () => {
    const answers = Object.values(answersMap.value);
    const res = await store.finalizeAssessment({
      recordId: recordId.value,
      answers,
      clinicalNotes: clinicalNotes.value,
      recommendations: recommendations.value,
    });

    if (res) {
      router.push({
        name: 'AssessmentReport',
        params: { childId: childId.value, recordId: recordId.value },
      });
    }
  });
}
</script>
