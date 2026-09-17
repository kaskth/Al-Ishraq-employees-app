<template>
  <q-dialog v-model="isOpen" persistent transition-show="scale" transition-hide="scale">
    <q-card class="w-full max-w-md rounded-3xl font-cairo shadow-2xl overflow-hidden" dir="rtl">
      <!-- Header -->
      <q-card-section class="bg-gradient-to-r from-primary to-indigo-900 text-white p-5 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <q-icon name="lock_reset" size="22px" />
          </div>
          <div>
            <div class="text-sm font-bold">تغيير كلمة المرور</div>
            <div class="text-[11px] text-white/75 font-medium">تأمين حساب الموظف بتشفير معتمد</div>
          </div>
        </div>
        <q-btn flat round dense icon="close" v-close-popup :disable="isLoading" />
      </q-card-section>

      <!-- Form -->
      <q-card-section class="p-5 space-y-4">
        <div class="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
          <q-icon name="shield" color="amber-8" size="18px" class="mt-0.5" />
          <span>إذا كنت تستخدم الرقم الافتراضي <strong class="font-mono font-bold">12345678</strong>، يرجى كتابته في خانة "الحالية" ثم تعيين كلمة مرور قوية خاصة بك.</span>
        </div>

        <!-- Current Password -->
        <q-input
          v-model="form.oldPassword"
          label="كلمة المرور الحالية"
          :type="showOld ? 'text' : 'password'"
          outlined
          dense
          class="rounded-xl"
          :rules="[val => !!val || 'يرجى إدخال كلمة المرور الحالية']"
        >
          <template v-slot:prepend>
            <q-icon name="vpn_key" color="primary" />
          </template>
          <template v-slot:append>
            <q-icon
              :name="showOld ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showOld = !showOld"
            />
          </template>
        </q-input>

        <!-- New Password -->
        <q-input
          v-model="form.newPassword"
          label="كلمة المرور الجديدة"
          :type="showNew ? 'text' : 'password'"
          outlined
          dense
          class="rounded-xl"
          :rules="[
            val => !!val || 'يرجى إدخال كلمة المرور الجديدة',
            val => val.length >= 6 || 'يجب ألا تقل عن 6 خانات'
          ]"
        >
          <template v-slot:prepend>
            <q-icon name="lock" color="primary" />
          </template>
          <template v-slot:append>
            <q-icon
              :name="showNew ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showNew = !showNew"
            />
          </template>
        </q-input>

        <!-- Confirm Password -->
        <q-input
          v-model="form.confirmPassword"
          label="تأكيد كلمة المرور الجديدة"
          :type="showConfirm ? 'text' : 'password'"
          outlined
          dense
          class="rounded-xl"
          :rules="[
            val => !!val || 'يرجى تأكيد كلمة المرور الجديدة',
            val => val === form.newPassword || 'كلمة المرور غير متطابقة'
          ]"
        >
          <template v-slot:prepend>
            <q-icon name="check_circle" color="primary" />
          </template>
          <template v-slot:append>
            <q-icon
              :name="showConfirm ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showConfirm = !showConfirm"
            />
          </template>
        </q-input>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="left" class="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
        <q-btn flat label="إلغاء" color="grey-8" v-close-popup class="rounded-xl text-xs font-bold" :disable="isLoading" />
        <q-btn
          unelevated
          label="تحديث وتشفير الحساب"
          color="primary"
          class="rounded-xl text-xs font-bold px-4 shadow-sm"
          style="background-color: #313C8E !important; color: #ffffff !important;"
          :loading="isLoading"
          :disable="!canSubmit"
          @click="submitChangePassword"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '../../../stores/auth.store';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const authStore = useAuthStore();
const isLoading = ref(false);

const showOld = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);

const form = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const canSubmit = computed(() => {
  return (
    form.value.oldPassword.trim().length > 0 &&
    form.value.newPassword.trim().length >= 6 &&
    form.value.newPassword === form.value.confirmPassword
  );
});

async function submitChangePassword() {
  if (!canSubmit.value) return;
  isLoading.value = true;
  const res = await authStore.changePassword(form.value.oldPassword.trim(), form.value.newPassword.trim());
  isLoading.value = false;

  if (res.success) {
    form.value.oldPassword = '';
    form.value.newPassword = '';
    form.value.confirmPassword = '';
    isOpen.value = false;
  }
}
</script>
