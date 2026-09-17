<template>
  <q-dialog v-model="isOpen" persistent transition-show="scale" transition-hide="scale">
    <q-card class="w-full max-w-md rounded-3xl font-cairo shadow-2xl">
      <!-- Header -->
      <q-card-section class="bg-gradient-to-r from-primary to-teal-800 text-white p-5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <q-icon name="assignment_add" size="28px" />
          <div class="text-base font-bold">إضافة مهمة مرافق جديدة</div>
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <!-- Form -->
      <q-card-section class="p-5 space-y-4">
        <q-input
          v-model="form.title"
          label="عنوان المهمة *"
          outlined
          dense
          placeholder="مثال: تعقيم صالة العلاج الطبيعي"
          class="rounded-xl"
        />

        <q-input
          v-model="form.locationArea"
          label="المنطقة أو المكان *"
          outlined
          dense
          placeholder="مثال: الدور الأول - عيادة 104"
          class="rounded-xl"
        />

        <q-select
          v-model="form.employeeId"
          :options="workerOptions"
          label="الموظف المكلف *"
          outlined
          dense
          emit-value
          map-options
          class="rounded-xl"
        />

        <q-input
          v-model="form.description"
          type="textarea"
          label="التفاصيل والتعليمات الإضافية"
          outlined
          rows="3"
          class="rounded-xl text-sm"
        />
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="left" class="p-5 bg-slate-50 border-t border-slate-100 flex gap-2">
        <q-btn flat label="إلغاء" color="grey-7" v-close-popup class="rounded-xl" />
        <q-btn
          unelevated
          label="إنشاء وتكليف المهمة"
          color="primary"
          class="rounded-xl px-6 font-bold"
          style="background-color: #313C8E !important; color: #ffffff !important;"
          :loading="isSubmitting"
          @click="submitTask"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useTaskStore } from '../../../stores/task.store';
import { apiClient } from '../../../api/client';
import { Notify } from 'quasar';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'taskCreated']);

const taskStore = useTaskStore();
const isOpen = ref(props.modelValue);
const isSubmitting = ref(false);
const isLoadingWorkers = ref(false);
const workerOptions = ref<{ label: string; value: number }[]>([]);

const form = ref({
  title: '',
  locationArea: '',
  employeeId: null as number | null,
  description: '',
});

async function loadAvailableWorkers() {
  isLoadingWorkers.value = true;
  try {
    const res = await apiClient.get('/tasks/available-workers');
    if (res.data?.status && Array.isArray(res.data?.data)) {
      workerOptions.value = res.data.data.map((w: any) => ({
        label: `${w.name} (${w.category || w.section || 'خدمات'})`,
        value: w.id,
      }));
      if (workerOptions.value.length > 0 && !form.value.employeeId) {
        form.value.employeeId = workerOptions.value[0].value;
      }
    }
  } catch (err) {
    console.warn('Failed to load available workers:', err);
  } finally {
    isLoadingWorkers.value = false;
  }
}

onMounted(() => {
  loadAvailableWorkers();
});

watch(() => props.modelValue, (val) => {
  isOpen.value = val;
  if (val && workerOptions.value.length === 0) {
    loadAvailableWorkers();
  }
});

watch(isOpen, (val) => {
  emit('update:modelValue', val);
});

async function submitTask() {
  if (!form.value.title.trim()) {
    Notify.create({ type: 'warning', message: 'يرجى كتابة عنوان المهمة' });
    return;
  }
  if (!form.value.employeeId) {
    Notify.create({ type: 'warning', message: 'يرجى اختيار الموظف المكلف' });
    return;
  }

  isSubmitting.value = true;
  try {
    const ok = await taskStore.createTask({
      title: form.value.title,
      locationArea: form.value.locationArea,
      employeeId: form.value.employeeId,
      description: form.value.description,
    });

    if (ok) {
      form.value = {
        title: '',
        locationArea: '',
        employeeId: 26,
        description: '',
      };
      isOpen.value = false;
      emit('taskCreated');
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>
