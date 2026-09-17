<template>
  <div class="space-y-6 pb-20 print:p-0 print:m-0">
    <!-- Top Bar: Navigation & Print (Hidden in Print) -->
    <div class="flex items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs print:hidden">
      <button
        @click="$router.push({ name: 'ChildIep', params: { id: childId } })"
        class="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowRight class="w-4 h-4 rtl-mirror" />
        <span>العودة لملف الطفل</span>
      </button>

      <div class="flex items-center gap-2">
        <q-btn
          flat
          no-caps
          label="طباعة التقرير"
          icon="print"
          @click="handlePrint"
          class="rounded-xl px-4 py-2 text-xs font-bold"
          style="background-color: #F1F5F9 !important; color: #334155 !important; font-weight: 700 !important;"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.isLoading && !reportData" class="py-16 text-center space-y-3">
      <q-spinner-dots color="primary" size="40px" />
      <p class="text-xs font-bold text-slate-500">جاري تحميل التقرير الطبي والتشخيص...</p>
    </div>

    <template v-else-if="reportData">
      <!-- Printable Document Container -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6 text-right font-sans print:border-none print:shadow-none print:p-2">
        <!-- Center Official Header -->
        <div class="flex items-center justify-between border-b-2 border-slate-100 pb-5">
          <div class="flex items-center gap-3.5">
            <div class="w-14 h-14 rounded-2xl bg-white p-1 border border-slate-200 flex items-center justify-center overflow-hidden shadow-xs">
              <img :src="reportData.centerInfo.logoUrl || '/logo.png'" alt="Logo" class="w-full h-full object-contain" />
            </div>
            <div class="space-y-0.5">
              <h2 class="text-base font-black text-brand-navy">{{ reportData.centerInfo.name }}</h2>
              <p class="text-[11px] font-bold text-brand-blue/80">{{ reportData.centerInfo.affiliation }}</p>
              <p class="text-[10px] text-slate-400 font-semibold">{{ reportData.centerInfo.license }}</p>
            </div>
          </div>

          <div class="text-left space-y-1">
            <span class="inline-block px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-brand-navy font-mono font-black text-xs">
              تقرير تشخيصي معتمد
            </span>
            <p class="text-[10px] text-slate-400 font-bold">تاريخ التقييم: {{ formatDate(record.evaluationDate) }}</p>
          </div>
        </div>

        <!-- Title of Assessment -->
        <div class="text-center py-2 bg-slate-50 rounded-2xl border border-slate-100">
          <h1 class="text-lg font-black text-slate-900">{{ record.template?.nameAr }}</h1>
          <p class="text-xs text-slate-500 font-bold font-sans">{{ record.template?.nameEn }}</p>
        </div>

        <!-- Child & Examiner Information Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs">
          <div>
            <p class="text-slate-400 font-bold text-[10px]">اسم الطفل</p>
            <p class="font-black text-slate-900 text-sm mt-0.5">{{ record.child?.name }}</p>
          </div>
          <div>
            <p class="text-slate-400 font-bold text-[10px]">النوع / العمر الزمني</p>
            <p class="font-black text-slate-900 mt-0.5">{{ record.child?.gender === 'ذكر' ? 'ذكر' : 'أنثى' }} • {{ record.child?.age }} سنوات</p>
          </div>
          <div>
            <p class="text-slate-400 font-bold text-[10px]">الأخصائي الفاحص</p>
            <p class="font-black text-slate-900 mt-0.5">{{ record.examinerName || record.employee?.name }}</p>
          </div>
          <div>
            <p class="text-slate-400 font-bold text-[10px]">الصفة الإكلينيكية</p>
            <p class="font-black text-slate-900 mt-0.5">{{ record.examinerTitle || 'أخصائي تأهيل إكلينيكي' }}</p>
          </div>
        </div>

        <!-- Diagnostic Severity Result Banner -->
        <div
          class="p-5 rounded-3xl border text-right space-y-2 shadow-xs"
          :class="getSeverityClass(record.severityLevel)"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider opacity-75">التصنيف الإكلينيكي المعتمد</span>
            <span class="px-3 py-1 rounded-full text-xs font-black shadow-xs" :class="getSeverityBadgeClass(record.severityLevel)">
              {{ getSeverityBadgeLabel(record.severityLevel) }}
            </span>
          </div>

          <!-- Main Metric Highlight -->
          <div class="flex items-baseline gap-3 pt-1">
            <template v-if="record.template?.code === 'CARS_2'">
              <span class="text-3xl font-black font-mono">{{ record.rawScoreTotal?.toFixed(1) }}</span>
              <span class="text-xs font-bold opacity-80">درجة مقننة من 60</span>
            </template>

            <template v-else-if="record.template?.code === 'PORTAGE'">
              <span class="text-2xl font-black">{{ record.developmentalAgeMonths ? `${Math.floor(record.developmentalAgeMonths / 12)} سنة و ${record.developmentalAgeMonths % 12} شهر` : '-' }}</span>
              <span class="text-xs font-bold opacity-80">(العمر النمائي المحسوب)</span>
            </template>

            <template v-else-if="record.template?.code === 'VINELAND_3'">
              <span class="text-3xl font-black font-mono">{{ record.standardScore }}</span>
              <span class="text-xs font-bold opacity-80">(مركب السلوك التكيفي ABC)</span>
            </template>

            <template v-else-if="record.template?.code === 'CONNERS_3'">
              <span class="text-3xl font-black font-mono">{{ record.standardScore }}</span>
              <span class="text-xs font-bold opacity-80">(الدرجة التائية المعيارية T-Score)</span>
            </template>
          </div>

          <p class="text-xs font-bold leading-relaxed pt-1">{{ record.classificationText }}</p>
        </div>

        <!-- Domain Radar / Visual Breakdown -->
        <div v-if="radarData && radarData.length > 0" class="space-y-3 pt-2">
          <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
            <Activity class="w-4 h-4 text-brand-navy" />
            <span>التحليل التفصيلي لمصفوفة الأبعاد النمائية والسلوكية</span>
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="dim in radarData"
              :key="dim.category"
              class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2"
            >
              <div class="flex items-center justify-between text-xs font-bold">
                <span class="text-slate-800">{{ dim.category }}</span>
                <span class="font-mono text-brand-navy font-black">{{ dim.score }} / {{ dim.maxScore }} ({{ dim.percentage }}%)</span>
              </div>
              <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="dim.percentage >= 65 ? 'bg-rose-500' : dim.percentage >= 40 ? 'bg-amber-500' : 'bg-emerald-500'"
                  :style="{ width: `${Math.min(dim.percentage, 100)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Special Portage Feature: Export Failed Items to IEP -->
        <div
          v-if="record.template?.code === 'PORTAGE' && unmasteredItems.length > 0"
          class="p-5 rounded-3xl bg-amber-50/70 border border-amber-200/80 space-y-4 print:hidden"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Sparkles class="w-5 h-5 text-amber-600" />
              <div>
                <h4 class="text-xs font-black text-amber-950">المهارات غير المتقنة المؤهلة للخطة الفردية (IEP)</h4>
                <p class="text-[11px] text-amber-800 font-semibold mt-0.5">
                  حدد المهارات التي ترغب في تحويلها بضغطة زر إلى أهداف تدريبية في خطة الطفل
                </p>
              </div>
            </div>

            <q-btn
              unelevated
              no-caps
              label="تصدير للخطة الفردية"
              icon="send"
              :loading="isExporting"
              :disabled="selectedItemCodes.length === 0"
              @click="handleExportIep"
              class="rounded-xl px-4 py-2 text-xs font-black shadow-md"
              style="background-color: #313C8E !important; color: #ffffff !important; font-weight: 800 !important;"
            />
          </div>

          <!-- Items Checkbox List -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
            <label
              v-for="it in unmasteredItems"
              :key="it.itemCode"
              class="p-2.5 rounded-xl bg-white border border-amber-200 flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-800 hover:bg-amber-100/40 transition-colors"
            >
              <input
                type="checkbox"
                v-model="selectedItemCodes"
                :value="it.itemCode"
                class="mt-0.5 rounded text-brand-navy focus:ring-brand-blue"
              />
              <div class="min-w-0">
                <span class="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-bold ml-1">
                  {{ it.domainName }}
                </span>
                <span>{{ it.description }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Clinical Notes & Recommendations -->
        <div class="space-y-4 pt-2">
          <div v-if="record.clinicalNotes" class="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
            <h4 class="text-xs font-black text-slate-900">الملاحظات السريرية</h4>
            <p class="text-xs text-slate-700 leading-relaxed">{{ record.clinicalNotes }}</p>
          </div>

          <div v-if="record.recommendations" class="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1">
            <h4 class="text-xs font-black text-brand-navy">التوصيات والبرنامج التأهيلي المقترح</h4>
            <p class="text-xs text-slate-800 leading-relaxed font-semibold">{{ record.recommendations }}</p>
          </div>
        </div>

        <!-- Signatures & Accreditation Footer -->
        <div class="pt-8 border-t-2 border-slate-100 grid grid-cols-2 gap-8 text-center text-xs">
          <div class="space-y-12">
            <p class="font-bold text-slate-500">توقيع الأخصائي / الطبيب الفاحص</p>
            <p class="font-black text-slate-900 border-t border-dashed border-slate-300 pt-2 inline-block px-8">
              {{ record.examinerName || record.employee?.name }}
            </p>
          </div>

          <div class="space-y-12">
            <p class="font-bold text-slate-500">اعتماد إدارة المركز والختم الرسمي</p>
            <div class="border-t border-dashed border-slate-300 pt-2 inline-block px-8">
              <p class="font-black text-brand-navy">مركز الإشراق للتأهيل</p>
              <p class="text-[10px] text-slate-400 font-bold">معتمد وموثق إلكترونياً</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClinicalAssessmentsStore } from '../../../stores/clinical-assessments.store';
import { useQuasar } from 'quasar';
import { ArrowRight, Activity, Sparkles } from 'lucide-vue-next';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const store = useClinicalAssessmentsStore();

const recordId = computed(() => Number(route.params.recordId));
const childId = computed(() => Number(route.params.childId));

const selectedItemCodes = ref<string[]>([]);
const isExporting = ref(false);

onMounted(async () => {
  if (recordId.value) {
    await store.fetchReportData(recordId.value);

    // Pre-select failed items for IEP by default
    if (unmasteredItems.value.length > 0) {
      selectedItemCodes.value = unmasteredItems.value.map((i) => i.itemCode);
    }
  }
});

const reportData = computed(() => store.reportData);
const record = computed(() => reportData.value?.record);
const radarData = computed(() => reportData.value?.radarData || []);

const unmasteredItems = computed(() => {
  if (!record.value || record.value.template?.code !== 'PORTAGE') return [];
  const catalog = record.value.templateItems || [];
  const scoreMap = new Map();
  (record.value.itemScores || []).forEach((s: any) => scoreMap.set(s.itemCode, s.scoreValue));

  return catalog
    .filter((c: any) => {
      const val = scoreMap.get(c.code);
      return val === 0.0 || val === undefined;
    })
    .map((c: any) => ({
      itemCode: c.code,
      domainName: c.domainAr || c.domain,
      description: c.title,
    }));
});

function formatDate(isoStr?: string) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getSeverityClass(level?: string) {
  if (!level) return 'bg-slate-50 border-slate-200 text-slate-800';
  if (['NONE', 'NORMAL', 'AVERAGE', 'ADEQUATE', 'HIGH'].includes(level)) {
    return 'bg-emerald-50/70 border-emerald-200 text-emerald-950';
  }
  if (['MILD_MODERATE', 'MILD_DELAY', 'MODERATE_DELAY', 'BORDERLINE', 'MODERATELY_LOW'].includes(level)) {
    return 'bg-amber-50/70 border-amber-200 text-amber-950';
  }
  return 'bg-rose-50/70 border-rose-200 text-rose-950';
}

function getSeverityBadgeClass(level?: string) {
  if (!level) return 'bg-slate-200 text-slate-800';
  if (['NONE', 'NORMAL', 'AVERAGE', 'ADEQUATE', 'HIGH'].includes(level)) {
    return 'bg-emerald-600 text-white';
  }
  if (['MILD_MODERATE', 'MILD_DELAY', 'MODERATE_DELAY', 'BORDERLINE', 'MODERATELY_LOW'].includes(level)) {
    return 'bg-amber-600 text-white';
  }
  return 'bg-rose-600 text-white';
}

function getSeverityBadgeLabel(level?: string) {
  const map: Record<string, string> = {
    NONE: 'طبيعي / غير دال',
    MILD_MODERATE: 'خفيف إلى متوسط',
    SEVERE: 'شديد وحاد',
    NORMAL: 'نمو طبيعي',
    MILD_DELAY: 'تأخر نمائي طفيف',
    MODERATE_DELAY: 'تأخر نمائي متوسط',
    SEVERE_DELAY: 'تأخر نمائي شديد',
    HIGH: 'أداء مرتفع',
    ADEQUATE: 'مناسب (طبيعي)',
    MODERATELY_LOW: 'حدّي / دون المتوسط',
    LOW: 'قصور تكيفي دال',
    AVERAGE: 'طبيعي',
    BORDERLINE: 'حدّي / قيد الملاحظة',
    ELEVATED: 'مرتفع دال إكلينيكياً',
    VERY_ELEVATED: 'شديد الارتفاع والدلالة',
  };
  return map[level || ''] || level || 'معتمد';
}

async function handleExportIep() {
  if (selectedItemCodes.value.length === 0) return;
  isExporting.value = true;
  try {
    const res = await store.exportIepGoals(recordId.value, selectedItemCodes.value);
    if (res) {
      $q.notify({
        type: 'positive',
        message: `تم تصدير ${selectedItemCodes.value.length} هدفاً بنجاح إلى الخطة الفردية للطفل`,
        position: 'top',
      });
    }
  } finally {
    isExporting.value = false;
  }
}

function handlePrint() {
  window.print();
}
</script>

<style scoped>
@media print {
  body {
    background: white !important;
  }
  .print\:hidden {
    display: none !important;
  }
}
</style>
