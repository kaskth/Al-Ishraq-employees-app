<template>
  <q-dialog v-model="isOpen" persistent maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card class="bg-slate-50 flex flex-col h-full font-cairo">
      <!-- Header -->
      <q-card-section class="bg-primary text-white p-4 shadow-md flex items-center justify-between">
        <div class="flex items-center gap-2">
          <q-icon name="history_edu" size="28px" />
          <div>
            <div class="text-base font-bold">سجل تقييمات الجلسات</div>
            <div class="text-xs text-teal-100" v-if="childName">{{ childName }}</div>
          </div>
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <!-- Content -->
      <q-card-section class="flex-1 overflow-y-auto p-4 space-y-4">
        <div v-if="therapyStore.isLoading" class="flex justify-center py-10">
          <q-spinner-dots color="primary" size="40px" />
        </div>

        <div v-else-if="therapyStore.evaluationHistory.length === 0" class="text-center py-12 text-slate-400">
          <q-icon name="folder_off" size="56px" class="opacity-50 mb-2" />
          <div class="text-sm font-bold">لا توجد تقييمات مسجلة سابقاً</div>
          <div class="text-xs mt-1">قم برصد أول جلسة من خلال شاشة التقييم</div>
        </div>

        <div v-else class="space-y-3">
          <q-card
            v-for="ev in therapyStore.evaluationHistory"
            :key="ev.id"
            flat
            bordered
            class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <q-chip dense color="teal-1" text-color="teal-9" class="font-bold text-xs">
                  الجزء {{ ev.part }}
                </q-chip>
                <span class="text-xs text-slate-500">{{ formatDate(ev.date || ev.created_at) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <q-badge :color="getScoreColor(ev.overallScore)" class="text-xs px-2 py-1 font-bold">
                  {{ ev.overallScore || 0 }}%
                </q-badge>
                <q-btn flat round dense size="sm" icon="edit" color="primary" @click="startEdit(ev)" />
                <q-btn flat round dense size="sm" icon="delete" color="red-5" @click="confirmDelete(ev.id)" />
              </div>
            </div>

            <!-- Notes -->
            <div class="space-y-2 mt-2 pt-2 border-t border-slate-100 text-xs">
              <div v-if="ev.behaviorNotes" class="bg-amber-50 p-2 rounded-xl border border-amber-100 text-amber-900">
                <span class="font-bold block text-amber-700">الملاحظات السلوكية:</span>
                {{ ev.behaviorNotes }}
              </div>
              <div v-if="ev.sensoryNotes" class="bg-indigo-50 p-2 rounded-xl border border-indigo-100 text-indigo-900">
                <span class="font-bold block text-indigo-700">الملاحظات الحسية:</span>
                {{ ev.sensoryNotes }}
              </div>
            </div>
          </q-card>
        </div>
      </q-card-section>

      <!-- Edit Modal -->
      <q-dialog v-model="isEditing" persistent>
        <q-card class="w-full max-w-md rounded-2xl font-cairo">
          <q-card-section class="bg-primary text-white p-4 flex items-center justify-between">
            <div class="text-base font-bold">تعديل التقييم</div>
            <q-btn flat round dense icon="close" v-close-popup />
          </q-card-section>

          <q-card-section class="p-4 space-y-4">
            <div>
              <div class="text-xs font-bold text-slate-600 mb-1">نسبة الإنجاز الكلية ({{ editForm.overallScore }}%)</div>
              <q-slider v-model="editForm.overallScore" :min="0" :max="100" :step="5" color="primary" label />
            </div>

            <q-input
              v-model="editForm.behaviorNotes"
              type="textarea"
              outlined
              label="الملاحظات السلوكية"
              rows="3"
              class="text-sm"
            />

            <q-input
              v-model="editForm.sensoryNotes"
              type="textarea"
              outlined
              label="الملاحظات الحسية والبيئية"
              rows="3"
              class="text-sm"
            />
          </q-card-section>

          <q-card-actions align="left" class="p-4 border-t border-slate-100">
            <q-btn flat label="إلغاء" color="grey" v-close-popup />
            <q-btn
              unelevated
              label="حفظ التعديلات"
              color="primary"
              class="rounded-xl px-6 font-bold"
              style="background-color: #313C8E !important; color: #ffffff !important;"
              :loading="isSaving"
              @click="saveEdit"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useTherapyStore } from '../../../stores/therapy.store';
import { useQuasar } from 'quasar';

const props = defineProps<{
  modelValue: boolean;
  childId?: number;
  childName?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const $q = useQuasar();
const therapyStore = useTherapyStore();
const isOpen = ref(props.modelValue);
const isEditing = ref(false);
const isSaving = ref(false);

const editForm = ref({
  id: 0,
  overallScore: 80,
  behaviorNotes: '',
  sensoryNotes: '',
});

watch(() => props.modelValue, (val) => {
  isOpen.value = val;
  if (val) {
    therapyStore.fetchEvaluationHistory(props.childId);
  }
});

watch(isOpen, (val) => {
  emit('update:modelValue', val);
});

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ar-EG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getScoreColor(score: number = 0) {
  if (score >= 80) return 'green-7';
  if (score >= 50) return 'amber-8';
  return 'red-6';
}

function startEdit(ev: any) {
  editForm.value = {
    id: ev.id,
    overallScore: ev.overallScore || 0,
    behaviorNotes: ev.behaviorNotes || '',
    sensoryNotes: ev.sensoryNotes || '',
  };
  isEditing.value = true;
}

async function saveEdit() {
  isSaving.value = true;
  try {
    const ok = await therapyStore.updateEvaluation(editForm.value.id, {
      overallScore: editForm.value.overallScore,
      behaviorNotes: editForm.value.behaviorNotes,
      sensoryNotes: editForm.value.sensoryNotes,
    });
    if (ok) isEditing.value = false;
  } finally {
    isSaving.value = false;
  }
}

function confirmDelete(id: number) {
  $q.dialog({
    title: 'تأكيد الحذف',
    message: 'هل أنت متأكد من رغبتك في حذف هذا التقييم؟ لا يمكن التراجع عن هذا الإجراء.',
    ok: { label: 'حذف', color: 'red-6', unelevated: true },
    cancel: { label: 'إلغاء', flat: true },
  }).onOk(async () => {
    await therapyStore.deleteEvaluation(id);
  });
}
</script>
