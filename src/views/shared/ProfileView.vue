<template>
  <div class="space-y-6 max-w-lg mx-auto font-cairo">
    <!-- Profile Card -->
    <div class="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
      <div class="flex items-center gap-4 min-w-0">
        <div class="w-16 h-16 rounded-2xl bg-brand-blue text-white font-black text-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
          <img
            v-if="authStore.user?.formalPersonalPhoto"
            :src="getPhotoUrl(authStore.user.formalPersonalPhoto)"
            alt="Avatar"
            class="w-full h-full object-cover"
          />
          <span v-else>{{ authStore.user?.name?.[0] || 'م' }}</span>
        </div>

        <div class="min-w-0 flex-1">
          <h2 class="text-base font-black text-slate-900 truncate">
            {{ authStore.user?.name }}
          </h2>
          <p class="text-xs text-brand-blue font-bold truncate mt-0.5">
            {{ authStore.user?.jobTitle || authStore.user?.category }}
          </p>
          <p class="text-[11px] text-slate-500 font-semibold truncate">
            وحدة: {{ authStore.user?.section }} • دوام {{ authStore.user?.workingPeriod || 'صباحي' }}
          </p>
        </div>
      </div>

      <q-btn
        flat
        round
        dense
        color="primary"
        icon="edit"
        @click="showEditProfileModal = true"
      >
        <q-tooltip>تعديل بيانات التواصل</q-tooltip>
      </q-btn>
    </div>

    <!-- Contact Info Overview -->
    <div class="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-xs text-xs space-y-2">
      <div class="flex items-center justify-between text-slate-600">
        <span class="flex items-center gap-1.5"><q-icon name="phone" color="primary" /> الهاتف المحمول:</span>
        <span class="font-bold text-slate-900 font-mono">{{ authStore.user?.phoneNumber || 'غير مسجل' }}</span>
      </div>
      <div class="flex items-center justify-between text-slate-600 border-t border-slate-100 pt-2">
        <span class="flex items-center gap-1.5"><q-icon name="home" color="primary" /> العنوان:</span>
        <span class="font-bold text-slate-900">{{ authStore.user?.address || 'غير مسجل' }}</span>
      </div>
      <div v-if="authStore.user?.email" class="flex items-center justify-between text-slate-600 border-t border-slate-100 pt-2">
        <span class="flex items-center gap-1.5"><q-icon name="email" color="primary" /> البريد الإلكتروني:</span>
        <span class="font-bold text-slate-900">{{ authStore.user.email }}</span>
      </div>
    </div>

    <!-- Leaves Balance Overview Cards -->
    <div class="space-y-3">
      <h3 class="text-sm font-black text-slate-900 px-1">رصيد الإجازات والأذون</h3>

      <div class="grid grid-cols-3 gap-3">
        <!-- Annual Leave Card -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
          <p class="text-[11px] font-bold text-slate-500 mb-1">الاعتيادية</p>
          <p class="text-xl font-black text-brand-blue">{{ leavesData?.annualRemaining ?? 14 }}</p>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">من {{ leavesData?.annualTotal ?? 14 }} يوم</p>
        </div>

        <!-- Casual Leave Card -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
          <p class="text-[11px] font-bold text-slate-500 mb-1">العارضة</p>
          <p class="text-xl font-black text-brand-orange">{{ leavesData?.casualRemaining ?? 7 }}</p>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">من {{ leavesData?.casualTotal ?? 7 }} أيام</p>
        </div>

        <!-- Permission Hours Card -->
        <div class="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
          <p class="text-[11px] font-bold text-slate-500 mb-1">أذون المغادرة</p>
          <p class="text-xl font-black text-emerald-600">{{ leavesData?.permissionHoursRemaining ?? 2 }}</p>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">ساعة متبقية</p>
        </div>
      </div>
    </div>

    <!-- Self-Service Action Buttons -->
    <div class="grid grid-cols-2 gap-3">
      <button
        @click="showLeaveModal = true"
        class="py-3.5 px-4 rounded-2xl bg-white border border-slate-200 hover:border-brand-blue text-slate-800 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <CalendarPlus class="w-4 h-4 text-brand-blue" />
        <span>طلب إجازة جديدة</span>
      </button>

      <button
        @click="showPermissionModal = true"
        class="py-3.5 px-4 rounded-2xl bg-white border border-slate-200 hover:border-brand-orange text-slate-800 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Clock class="w-4 h-4 text-brand-orange" />
        <span>طلب إذن مغادرة</span>
      </button>
    </div>

    <!-- Security & Account Settings Card -->
    <div class="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600">
          <Lock class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-xs font-black text-slate-900">أمان الحساب وكلمة المرور</h4>
          <p class="text-[11px] text-slate-500 font-medium">تغيير الرقم السري لحماية حسابك وتشفيره</p>
        </div>
      </div>

      <button
        @click="showChangePasswordModal = true"
        class="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-brand-blue font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
      >
        <span>تغيير</span>
        <ChevronLeft class="w-3.5 h-3.5 rtl-mirror" />
      </button>
    </div>

    <!-- My Requests History -->
    <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
          <q-icon name="history" color="primary" size="20px" />
          <span>سجل طلباتي ومتابعة حالتها</span>
        </h3>
        <q-btn flat round dense icon="refresh" color="grey-7" @click="attendanceStore.fetchMyRequests" />
      </div>

      <div v-if="allRequests.length === 0" class="py-6 text-center text-xs text-slate-400 font-bold">
        لا توجد طلبات إجازة أو أذونات مسجلة مؤخراً
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="req in allRequests"
          :key="req.requestType + req.id"
          class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3"
        >
          <div class="space-y-1 text-xs">
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-900">
                {{ req.requestType === 'LEAVE' ? `إجازة (${req.leaveType})` : `إذن مغادرة (${req.hoursRequested} ساعة)` }}
              </span>
              <q-badge :color="getStatusColor(req.status)" class="text-[10px] font-bold">
                {{ getStatusLabel(req.status) }}
              </q-badge>
            </div>
            <p class="text-[11px] text-slate-500 font-medium">
              التاريخ: {{ formatDate(req.startDate || req.date) }} • {{ req.reason || 'بدون تفاصيل' }}
            </p>
          </div>

          <div v-if="req.status === 'PENDING'">
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="cancel"
              color="red-5"
              @click="confirmCancelRequest(req.requestType, req.id)"
            >
              <q-tooltip>إلغاء الطلب</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Request Leave Modal -->
    <div v-if="showLeaveModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-cairo">
      <div class="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
        <h3 class="text-sm font-black text-slate-900 border-b pb-3">تقديم طلب إجازة</h3>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">نوع الإجازة</label>
          <select v-model="leaveForm.leaveType" class="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold">
            <option value="ANNUAL">إجازة اعتيادية</option>
            <option value="CASUAL">إجازة عارضة</option>
            <option value="SICK">إجازة مرضية</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">من تاريخ</label>
            <input v-model="leaveForm.startDate" type="date" class="w-full p-2 rounded-xl bg-slate-50 border text-xs" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">إلى تاريخ</label>
            <input v-model="leaveForm.endDate" type="date" class="w-full p-2 rounded-xl bg-slate-50 border text-xs" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">سبب الإجازة</label>
          <textarea v-model="leaveForm.reason" rows="2" placeholder="اكتب السبب باختصار..." class="w-full p-2.5 rounded-xl bg-slate-50 border text-xs"></textarea>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <q-btn flat label="إلغاء" color="grey-8" @click="showLeaveModal = false" class="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200" />
          <q-btn unelevated label="إرسال الطلب" color="primary" @click="submitLeave" class="flex-1 py-2 rounded-xl text-xs font-bold shadow-sm" style="background-color: #313C8E !important; color: #ffffff !important;" />
        </div>
      </div>
    </div>

    <!-- Request Permission Modal -->
    <div v-if="showPermissionModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-cairo">
      <div class="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
        <h3 class="text-sm font-black text-slate-900 border-b pb-3">طلب إذن مغادرة</h3>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">تاريخ الإذن</label>
          <input v-model="permissionForm.date" type="date" class="w-full p-2.5 rounded-xl bg-slate-50 border text-xs" />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">عدد الساعات المطلوبة (حد أقصى ساعتان شهرياً)</label>
          <select v-model="permissionForm.hoursRequested" class="w-full p-2.5 rounded-xl bg-slate-50 border text-xs font-bold">
            <option :value="1.0">ساعة واحدة (1.0)</option>
            <option :value="1.5">ساعة ونصف (1.5)</option>
            <option :value="2.0">ساعتان (2.0)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">سبب الاستئذان</label>
          <input v-model="permissionForm.reason" type="text" placeholder="سبب الإذن..." class="w-full p-2.5 rounded-xl bg-slate-50 border text-xs" />
        </div>

        <div class="flex items-center gap-2 pt-2">
          <q-btn flat label="إلغاء" color="grey-8" @click="showPermissionModal = false" class="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200" />
          <q-btn unelevated label="إرسال الإذن" color="warning" @click="submitPermission" class="flex-1 py-2 rounded-xl text-xs font-bold shadow-sm" style="background-color: #F59E0B !important; color: #ffffff !important;" />
        </div>
      </div>
    </div>

    <!-- Center Identity Card -->
    <div class="p-4 rounded-3xl bg-gradient-to-br from-white to-sky-50/50 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
      <div class="w-12 h-12 rounded-2xl bg-white p-1 border border-slate-200/80 shadow-xs flex-shrink-0 flex items-center justify-center">
        <img src="/logo.png" alt="شعار المركز" class="w-full h-full object-contain" />
      </div>
      <div class="text-xs">
        <p class="font-black text-slate-900 leading-snug">القوات الجوية — مركز الإشراق</p>
        <p class="text-[11px] text-slate-500 font-medium">لرعاية وتأهيل ذوي الاحتياجات الخاصة</p>
        <p class="text-[10px] text-brand-navy font-bold mt-0.5">منظومة إدارة الكوادر المتكاملة v3.0</p>
      </div>
    </div>

    <!-- Edit Profile Dialog -->
    <EditProfileDialog
      v-model="showEditProfileModal"
      @profile-updated="authStore.fetchMe"
    />

    <!-- Change Password Dialog -->
    <ChangePasswordDialog
      v-model="showChangePasswordModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth.store';
import { useAttendanceStore } from '../../stores/attendance.store';
import { useQuasar } from 'quasar';
import { CalendarPlus, Clock, Lock, ChevronLeft } from 'lucide-vue-next';
import EditProfileDialog from './components/EditProfileDialog.vue';
import ChangePasswordDialog from './components/ChangePasswordDialog.vue';

const $q = useQuasar();
const authStore = useAuthStore();
const attendanceStore = useAttendanceStore();

const leavesData = computed(() => attendanceStore.leavesBalance);
const allRequests = computed(() => {
  const l = attendanceStore.myRequests.leaves || [];
  const p = attendanceStore.myRequests.permissions || [];
  return [...l, ...p].sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());
});

const showLeaveModal = ref(false);
const showPermissionModal = ref(false);
const showEditProfileModal = ref(false);
const showChangePasswordModal = ref(false);

const leaveForm = ref({
  leaveType: 'ANNUAL',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  reason: '',
});

const permissionForm = ref({
  date: new Date().toISOString().split('T')[0],
  hoursRequested: 1.0,
  reason: '',
});

onMounted(async () => {
  await attendanceStore.fetchLeavesBalance();
  await attendanceStore.fetchMyRequests();
  await authStore.fetchMe();
});

async function submitLeave() {
  const ok = await attendanceStore.submitLeave(leaveForm.value);
  if (ok) {
    showLeaveModal.value = false;
    leaveForm.value.reason = '';
    await attendanceStore.fetchLeavesBalance();
  }
}

async function submitPermission() {
  const ok = await attendanceStore.submitPermission(permissionForm.value);
  if (ok) {
    showPermissionModal.value = false;
    permissionForm.value.reason = '';
    await attendanceStore.fetchLeavesBalance();
  }
}

function confirmCancelRequest(type: 'LEAVE' | 'PERMISSION', id: number) {
  $q.dialog({
    title: 'تأكيد الإلغاء',
    message: 'هل أنت متأكد من إلغاء هذا الطلب المعلق؟',
    ok: { label: 'نعم، إلغاء', color: 'red-6', unelevated: true },
    cancel: { label: 'تراجع', flat: true },
  }).onOk(async () => {
    await attendanceStore.cancelMyRequest(type, id);
    await attendanceStore.fetchLeavesBalance();
  });
}

function getStatusColor(status: string) {
  if (status === 'APPROVED') return 'green-7';
  if (status === 'REJECTED') return 'red-7';
  return 'amber-8';
}

function getStatusLabel(status: string) {
  if (status === 'APPROVED') return 'معتمد';
  if (status === 'REJECTED') return 'مرفوض';
  return 'قيد الانتظار';
}

function getPhotoUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `http://localhost:3010/${path.replace(/^\/+/, '')}`;
}

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}
</script>
