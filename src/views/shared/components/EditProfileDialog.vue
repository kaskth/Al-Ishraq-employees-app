<template>
  <q-dialog v-model="isOpen" persistent transition-show="scale" transition-hide="scale">
    <q-card class="w-full max-w-md rounded-3xl font-cairo shadow-2xl">
      <!-- Header -->
      <q-card-section class="bg-primary text-white p-5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <q-icon name="manage_accounts" size="28px" />
          <div class="text-base font-bold">تعديل بيانات التواصل</div>
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <!-- Form -->
      <q-card-section class="p-5 space-y-4">
        <q-input
          v-model="form.phoneNumber"
          label="رقم الهاتف المحمول"
          outlined
          dense
          type="tel"
          class="rounded-xl"
        >
          <template v-slot:prepend>
            <q-icon name="phone" color="primary" />
          </template>
        </q-input>

        <q-input
          v-model="form.address"
          label="عنوان السكن"
          outlined
          dense
          class="rounded-xl"
        >
          <template v-slot:prepend>
            <q-icon name="home" color="primary" />
          </template>
        </q-input>

        <q-input
          v-model="form.email"
          label="البريد الإلكتروني"
          outlined
          dense
          type="email"
          class="rounded-xl"
        >
          <template v-slot:prepend>
            <q-icon name="email" color="primary" />
          </template>
        </q-input>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="left" class="p-5 bg-slate-50 border-t border-slate-100 flex gap-2">
        <q-btn flat label="إلغاء" color="grey-7" v-close-popup class="rounded-xl" />
        <q-btn
          unelevated
          label="حفظ التعديلات"
          color="primary"
          class="rounded-xl px-6 font-bold"
          style="background-color: #313C8E !important; color: #ffffff !important;"
          :loading="isSubmitting"
          @click="submitProfile"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAuthStore } from '../../../stores/auth.store';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'profileUpdated']);

const authStore = useAuthStore();
const isOpen = ref(props.modelValue);
const isSubmitting = ref(false);

const form = ref({
  phoneNumber: '',
  address: '',
  email: '',
});

watch(() => props.modelValue, (val) => {
  isOpen.value = val;
  if (val && authStore.user) {
    form.value = {
      phoneNumber: authStore.user.phoneNumber || '',
      address: authStore.user.address || '',
      email: authStore.user.email || '',
    };
  }
});

watch(isOpen, (val) => {
  emit('update:modelValue', val);
});

async function submitProfile() {
  isSubmitting.value = true;
  try {
    const ok = await authStore.updateProfile({
      phoneNumber: form.value.phoneNumber || undefined,
      address: form.value.address || undefined,
      email: form.value.email || undefined,
    });

    if (ok) {
      isOpen.value = false;
      emit('profileUpdated');
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>
