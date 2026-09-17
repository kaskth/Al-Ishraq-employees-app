<template>
  <div class="space-y-6">
    <!-- Top Return & Header -->
    <div class="flex items-center justify-between">
      <button
        @click="$router.back()"
        class="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowRight class="w-4 h-4 rtl-mirror" />
        <span>العودة لقائمة الأطفال</span>
      </button>

      <button
        @click="showIncidentDialog = true"
        class="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        <AlertTriangle class="w-4 h-4 text-rose-500" />
        <span>تسجيل عارض سلوكي</span>
      </button>
    </div>

    <!-- Child Profile Card -->
    <div
      v-if="therapyStore.activeIep"
      class="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-right"
    >
      <div class="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-2xl overflow-hidden flex-shrink-0 shadow-inner">
        <img
          v-if="therapyStore.activeIep.formalPersonalPhoto"
          :src="getPhotoUrl(therapyStore.activeIep.formalPersonalPhoto)"
          alt="Child"
          class="w-full h-full object-cover"
        />
        <span v-else>{{ therapyStore.activeIep.name[0] }}</span>
      </div>

      <div class="space-y-1 min-w-0 flex-1">
        <h2 class="text-xl font-black text-slate-900 truncate">
          {{ therapyStore.activeIep.name }}
        </h2>
        <p class="text-xs font-semibold text-brand-blue">
          {{ therapyStore.activeIep.category }} • وحدة {{ therapyStore.activeIep.section }}
        </p>
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
          <span class="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">
            العمر: {{ therapyStore.activeIep.age || 'غير محدد' }} سنوات
          </span>
          <span class="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-brand-blue font-bold">
            الالتحاق: {{ formatDate(therapyStore.activeIep.enrollmentDate) }}
          </span>
          <span v-if="therapyStore.activeIep.nextAssessmentDate" class="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold">
            التقييم القادم: {{ formatDate(therapyStore.activeIep.nextAssessmentDate) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Tablet Split View / Responsive Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Section 1: Individual Education Programs (IEP Programs & PDF files) -->
      <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
            <FileText class="w-4 h-4 text-brand-blue" />
            <span>البرامج التأهيلية الفردية (IEP)</span>
          </h3>
          <span class="text-xs text-slate-400 font-bold">
            {{ therapyStore.activeIep?.ChildrenPrograms?.length || 0 }} برامج
          </span>
        </div>

        <div v-if="therapyStore.activeIep?.ChildrenPrograms?.length === 0" class="py-6 text-center text-xs text-slate-400 font-bold">
          لم يتم إدراج ملفات برامج تأهيلية بعد
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="prog in therapyStore.activeIep?.ChildrenPrograms"
            :key="prog.id"
            class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3"
          >
            <div>
              <h4 class="text-xs font-bold text-slate-900">{{ prog.title }}</h4>
              <p class="text-[11px] text-slate-500 font-semibold mt-0.5">
                {{ prog.specialization }} • بدء: {{ formatDate(prog.startDate) }}
              </p>
            </div>
            <a
              v-if="prog.filePath"
              :href="`http://localhost:3010/${prog.filePath.replace(/^\/+/, '')}`"
              target="_blank"
              class="px-3 py-1.5 rounded-xl bg-blue-100 text-brand-blue hover:bg-brand-blue hover:text-white transition-all text-xs font-bold flex items-center gap-1"
            >
              <Download class="w-3.5 h-3.5" />
              <span>تحميل</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Section 2: Session Evaluations Timeline -->
      <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
            <Clock class="w-4 h-4 text-brand-orange" />
            <span>سجل تقييم الجلسات السابقة</span>
          </h3>
          <button
            @click="showHistoryDialog = true"
            class="text-xs text-primary font-bold hover:underline flex items-center gap-1"
          >
            <span>إدارة وتعديل السجل</span>
            <ArrowRight class="w-3 h-3 rotate-180" />
          </button>
        </div>

        <div v-if="therapyStore.activeIep?.mobileSessionEvaluations?.length === 0" class="py-6 text-center text-xs text-slate-400 font-bold">
          لم يتم رصد جلسات سابقة مسجلة بعد
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="evalItem in therapyStore.activeIep?.mobileSessionEvaluations"
            :key="evalItem.id"
            class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2"
          >
            <div class="flex items-center justify-between text-xs font-bold">
              <span class="text-slate-800">جلسة تاريخ {{ formatDate(evalItem.date) }}</span>
              <span class="text-amber-600 font-extrabold">{{ evalItem.overallScore }}% ★</span>
            </div>
            <p v-if="evalItem.behaviorNotes" class="text-[11px] text-slate-600 font-medium">
              <span class="font-bold text-slate-700">السلوك:</span> {{ evalItem.behaviorNotes }}
            </p>
            <p v-if="evalItem.sensoryNotes" class="text-[11px] text-slate-600 font-medium">
              <span class="font-bold text-slate-700">الحسي:</span> {{ evalItem.sensoryNotes }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Clinical Assessments & Diagnostic Evaluations (The 4 Gold Standards) -->
    <div class="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 text-right">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
            <Activity class="w-4 h-4 text-indigo-600" />
            <span>المقاييس الإكلينيكية والتشخيص المعياري</span>
          </h3>
          <p class="text-[11px] text-slate-500 font-semibold mt-0.5">
            تطبيق واعتماد المقاييس العالمية الأربعة (بورتيدج • كارز 2 • فايلاند • كونرز) مع استخراج التقارير والربط بالخطة الفردية
          </p>
        </div>

        <q-btn
          unelevated
          no-caps
          label="تطبيق مقياس جديد +"
          @click="showStartModal = true"
          class="rounded-xl px-4 py-2 text-xs font-black shadow-md self-start sm:self-auto"
          style="background-color: #313C8E !important; color: #ffffff !important; font-weight: 800 !important;"
        />
      </div>

      <!-- Assessments List -->
      <div v-if="clinicalStore.childAssessments.length === 0" class="py-10 text-center space-y-2">
        <p class="text-xs text-slate-400 font-bold">لم يتم تطبيق أي من المقاييس الإكلينيكية لهذا الطفل حتى الآن</p>
        <p class="text-[11px] text-indigo-600 font-semibold">اضغط على زر «تطبيق مقياس جديد» لبدء جلسة تقييم فورية ومؤتمتة الحسابات</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div
          v-for="rec in clinicalStore.childAssessments"
          :key="rec.id"
          class="p-4 rounded-2xl border transition-all space-y-3"
          :class="rec.status === 'FINALIZED' ? 'bg-slate-50/70 border-slate-200' : 'bg-amber-50/40 border-amber-200'"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="space-y-0.5">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-lg bg-indigo-100 text-brand-navy font-mono font-black text-[10px]">
                  {{ rec.template?.code }}
                </span>
                <h4 class="text-xs font-black text-slate-900">{{ rec.template?.nameAr }}</h4>
              </div>
              <p class="text-[10px] text-slate-400 font-semibold">
                الفاحص: {{ rec.examinerName || rec.employee?.name }} • {{ formatDate(rec.evaluationDate) }}
              </p>
            </div>

            <span
              class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
              :class="rec.status === 'FINALIZED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
            >
              {{ rec.status === 'FINALIZED' ? 'معتمد وموثق ✓' : 'مسودة قيد التطبيق' }}
            </span>
          </div>

          <!-- Score / Severity Highlight -->
          <div v-if="rec.classificationText" class="p-2.5 rounded-xl bg-white border border-slate-200/80 text-[11px] font-bold text-slate-700 leading-relaxed">
            {{ rec.classificationText }}
          </div>

          <!-- Action Button with Guaranteed Contrast -->
          <div class="pt-1 flex items-center justify-end">
            <q-btn
              v-if="rec.status === 'FINALIZED'"
              unelevated
              no-caps
              label="عرض وطباعة التقرير الطبي"
              @click="openReport(rec.id)"
              class="rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-xs"
              style="background-color: #313C8E !important; color: #ffffff !important;"
            />
            <q-btn
              v-else
              unelevated
              no-caps
              label="متابعة استكمال التقييم"
              @click="resumeAssessment(rec.id)"
              class="rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-xs"
              style="background-color: #F59E0B !important; color: #ffffff !important;"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Start New Assessment Modal -->
    <div
      v-if="showStartModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans text-right"
    >
      <div class="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b pb-3">
          <div class="flex items-center gap-2 text-slate-900 font-black text-sm">
            <Activity class="w-5 h-5 text-indigo-600" />
            <span>اختيار وتطبيق مقياس إكلينيكي</span>
          </div>
          <button @click="showStartModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <p class="text-xs text-slate-500 font-semibold leading-relaxed">
          اختر المقياس المناسب لحالة وعمر الطفل
          <span class="font-bold text-slate-900">({{ therapyStore.activeIep?.name }} - {{ therapyStore.activeIep?.age }} سنوات)</span>:
        </p>

        <!-- The 4 Test Cards -->
        <div class="grid grid-cols-1 gap-2.5">
          <!-- CARS-2 -->
          <button
            @click="handleSelectTemplateToStart('CARS_2')"
            class="p-4 rounded-2xl border border-slate-200 hover:border-brand-navy bg-slate-50 hover:bg-indigo-50/40 transition-all text-right space-y-1 cursor-pointer group"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-brand-navy group-hover:text-indigo-700">مقياس كارز 2 لتقدير التوحد (CARS-2)</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border text-indigo-800">من سنتين فما فوق</span>
            </div>
            <p class="text-[11px] text-slate-600 font-medium">15 بُعداً سلوكياً لتشخيص وتحديد شدة اضطراب طيف التوحد وحساب درجات القطع آلياً.</p>
          </button>

          <!-- PORTAGE -->
          <button
            @click="handleSelectTemplateToStart('PORTAGE')"
            class="p-4 rounded-2xl border border-slate-200 hover:border-brand-navy bg-slate-50 hover:bg-indigo-50/40 transition-all text-right space-y-1 cursor-pointer group"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-brand-navy group-hover:text-indigo-700">مقياس البورتيدج للتربية المبكرة والنمو</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border text-emerald-800">من 0 حتى 6-9 سنوات</span>
            </div>
            <p class="text-[11px] text-slate-600 font-medium">حساب العمر النمائي بالشهور ونسبة التأخر عبر 6 مجالات، مع تصدير الأهداف للخطة الفردية (IEP).</p>
          </button>

          <!-- VINELAND-3 -->
          <button
            @click="handleSelectTemplateToStart('VINELAND_3')"
            class="p-4 rounded-2xl border border-slate-200 hover:border-brand-navy bg-slate-50 hover:bg-indigo-50/40 transition-all text-right space-y-1 cursor-pointer group"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-brand-navy group-hover:text-indigo-700">مقياس فايلاند للسلوك التكيفي (Vineland-3)</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border text-blue-800">من الرضاعة حتى البلوغ</span>
            </div>
            <p class="text-[11px] text-slate-600 font-medium">قياس مهارات الاستقلالية والتواصل والحياة اليومية لتشخيص درجات الإعاقة الذهنية ومستوى الاعتمادية.</p>
          </button>

          <!-- CONNERS-3 -->
          <button
            @click="handleSelectTemplateToStart('CONNERS_3')"
            class="p-4 rounded-2xl border border-slate-200 hover:border-brand-navy bg-slate-50 hover:bg-indigo-50/40 transition-all text-right space-y-1 cursor-pointer group"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-brand-navy group-hover:text-indigo-700">مقياس كونرز-3 لفرط الحركة وتشتت الانتباه (ADHD)</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border text-amber-800">من 6 حتى 18 سنة</span>
            </div>
            <p class="text-[11px] text-slate-600 font-medium">حساب درجات T-Scores ومطابقة معايير الدليل التشخيصي DSM-5 لأنماط الغفلة والاندفاع والعناد.</p>
          </button>
        </div>

        <div class="pt-2 flex justify-end">
          <q-btn
            flat
            no-caps
            label="إلغاء"
            @click="showStartModal = false"
            class="rounded-xl px-5 py-2 text-xs font-bold"
            style="background-color: #F1F5F9 !important; color: #334155 !important; font-weight: 700 !important;"
          />
        </div>
      </div>
    </div>

    <!-- Evaluation History Dialog -->
    <EvaluationHistoryDialog
      v-model="showHistoryDialog"
      :child-id="therapyStore.activeIep?.id"
      :child-name="therapyStore.activeIep?.name"
    />

    <!-- Incident Report Dialog -->
    <IncidentReportDialog
      v-if="showIncidentDialog && therapyStore.activeIep"
      :child-id="therapyStore.activeIep.id"
      @close="showIncidentDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTherapyStore } from '../../stores/therapy.store';
import { useClinicalAssessmentsStore } from '../../stores/clinical-assessments.store';
import IncidentReportDialog from './components/IncidentReportDialog.vue';
import EvaluationHistoryDialog from './components/EvaluationHistoryDialog.vue';
import {
  ArrowRight,
  AlertTriangle,
  FileText,
  Clock,
  Download,
  Activity,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const therapyStore = useTherapyStore();
const clinicalStore = useClinicalAssessmentsStore();

const showIncidentDialog = ref(false);
const showHistoryDialog = ref(false);
const showStartModal = ref(false);

onMounted(async () => {
  const childId = Number(route.params.id);
  if (childId) {
    therapyStore.fetchChildIep(childId);
    clinicalStore.fetchChildAssessments(childId);
  }
});

function getPhotoUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `http://localhost:3010/${path.replace(/^\/+/, '')}`;
}

function formatDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function handleSelectTemplateToStart(templateCode: string) {
  showStartModal.value = false;
  const childId = therapyStore.activeIep?.id;
  if (!childId) return;

  const record = await clinicalStore.startAssessment({
    childId,
    templateCode,
  });

  if (record) {
    router.push({
      name: 'AssessmentRunner',
      params: { childId, recordId: record.id },
    });
  }
}

function resumeAssessment(recId: number) {
  const childId = therapyStore.activeIep?.id;
  router.push({
    name: 'AssessmentRunner',
    params: { childId, recordId: recId },
  });
}

function openReport(recId: number) {
  const childId = therapyStore.activeIep?.id;
  router.push({
    name: 'AssessmentReport',
    params: { childId, recordId: recId },
  });
}
</script>

