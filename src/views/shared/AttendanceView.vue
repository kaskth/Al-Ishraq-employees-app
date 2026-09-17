<template>
  <div class="space-y-5 max-w-lg mx-auto pb-12 font-sans" dir="rtl">
    <!-- Header -->
    <div class="text-center space-y-1">
      <h2 class="text-xl font-black text-slate-900">إثبات الحضور والانصراف الذكي</h2>
      <p class="text-xs font-semibold text-slate-500">
        التحقق الثلاثي: الوردية • النطاق الجغرافي (GPS) • البصمة الحيوية
      </p>
    </div>

    <!-- Active Shift & Time Window Card -->
    <div class="p-4 rounded-3xl bg-gradient-to-br from-[#1E255E] to-[#313C8E] text-white shadow-lg space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10"
            :class="attendanceStore.shiftDetails?.shiftType === 'EVENING' ? 'bg-amber-500/20 text-amber-300' : 'bg-brand-cyan/20 text-brand-cyan'"
          >
            <Moon v-if="attendanceStore.shiftDetails?.shiftType === 'EVENING'" class="w-4 h-4" />
            <Sun v-else class="w-4 h-4" />
          </div>
          <div>
            <div class="text-[11px] font-bold text-sky-200/80">الوردية المعتمدة</div>
            <div class="text-sm font-black text-white">{{ attendanceStore.shiftDetails?.shiftName || 'الفترة الصباحية' }}</div>
          </div>
        </div>

        <div class="text-left">
          <div class="text-[10px] text-sky-200/70 font-bold">ساعات الدوام</div>
          <div class="text-xs font-black text-amber-300 font-mono">
            {{ attendanceStore.shiftDetails?.startTime || '08:30' }} - {{ attendanceStore.shiftDetails?.endTime || '13:30' }}
          </div>
        </div>
      </div>

      <!-- Window Status Banner -->
      <div
        v-if="attendanceStore.attendanceWindow"
        class="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-semibold"
      >
        <span class="text-[11px] text-sky-100 flex items-center gap-1.5">
          <Clock class="w-3.5 h-3.5 text-brand-cyan" />
          <span>حالة شباك التسجيل:</span>
        </span>
        <span
          class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border"
          :class="attendanceStore.attendanceWindow.canCheckIn || attendanceStore.attendanceWindow.canCheckOut
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
            : 'bg-white/10 text-amber-200 border-white/15'"
        >
          {{ attendanceStore.attendanceWindow.windowMessage }}
        </span>
      </div>

      <!-- Split Shift Badges -->
      <div v-if="attendanceStore.shiftDetails?.isSplit" class="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
        <span class="text-[11px] text-sky-200/80 font-medium">نظام الفترتين:</span>
        <div class="flex items-center gap-1.5">
          <span
            class="px-2 py-0.5 rounded-lg text-[10px] font-bold"
            :class="attendanceStore.shiftDetails?.activeWindow === 'MORNING' ? 'bg-brand-cyan text-slate-950' : 'bg-white/10 text-slate-300'"
          >
            الصباحية 08:30
          </span>
          <span
            class="px-2 py-0.5 rounded-lg text-[10px] font-bold"
            :class="attendanceStore.shiftDetails?.activeWindow === 'EVENING' ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-slate-300'"
          >
            المسائية 14:00
          </span>
        </div>
      </div>
    </div>

    <!-- Smart Readiness Checklist Card (Human Guide for Employee) -->
    <div class="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
      <div class="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 class="text-xs font-black text-slate-800 flex items-center gap-1.5">
          <ShieldCheck class="w-4 h-4 text-brand-navy" />
          <span>جاهزية شروط البصمة الذكية</span>
        </h3>
        <button
          @click="handleRecheckGps"
          :disabled="attendanceStore.gpsStatus === 'CHECKING'"
          class="text-[11px] font-bold text-brand-navy hover:text-blue-900 flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw class="w-3 h-3" :class="attendanceStore.gpsStatus === 'CHECKING' ? 'animate-spin' : ''" />
          <span>إعادة الفحص</span>
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <!-- 1. GPS Service Status -->
        <div
          class="p-2.5 rounded-2xl border flex items-center justify-between gap-2"
          :class="attendanceStore.gpsStatus === 'READY'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
            : (attendanceStore.gpsStatus === 'CHECKING'
              ? 'bg-amber-50/70 border-amber-200 text-amber-800'
              : 'bg-rose-50/80 border-rose-200 text-rose-800')"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="w-2 h-2 rounded-full flex-shrink-0"
              :class="attendanceStore.gpsStatus === 'READY' ? 'bg-emerald-500' : (attendanceStore.gpsStatus === 'CHECKING' ? 'bg-amber-500 animate-ping' : 'bg-rose-500 animate-pulse')"
            ></span>
            <div class="truncate">
              <div class="text-[10px] font-bold opacity-75">خدمة الموقع (GPS)</div>
              <div class="text-xs font-extrabold truncate">
                {{ attendanceStore.gpsStatus === 'READY' ? 'مفعل ومتاح' : (attendanceStore.gpsStatus === 'CHECKING' ? 'جارٍ الفحص...' : 'مغلق على الهاتف') }}
              </div>
            </div>
          </div>

          <button
            v-if="attendanceStore.gpsStatus !== 'READY'"
            @click="showGpsHelpModal = true"
            class="text-[10px] px-2 py-1 rounded-lg bg-white border border-rose-300 font-bold text-rose-700 shadow-2xs hover:bg-rose-50 flex-shrink-0 cursor-pointer"
          >
            إرشادات الحل
          </button>
        </div>

        <!-- 2. Distance from Center Geofence -->
        <div
          class="p-2.5 rounded-2xl border flex items-center justify-between gap-2"
          :class="attendanceStore.currentDistanceMeters !== null
            ? (attendanceStore.isInsideGeofence
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
              : 'bg-amber-50/70 border-amber-200 text-amber-800')
            : 'bg-slate-50 border-slate-200 text-slate-600'"
        >
          <div class="flex items-center gap-2 min-w-0">
            <MapPin class="w-3.5 h-3.5 flex-shrink-0" :class="attendanceStore.isInsideGeofence ? 'text-emerald-600' : 'text-amber-600'" />
            <div class="truncate">
              <div class="text-[10px] font-bold opacity-75">المسافة عن المقر</div>
              <div class="text-xs font-extrabold truncate">
                <span v-if="attendanceStore.currentDistanceMeters !== null">
                  {{ attendanceStore.isInsideGeofence ? `داخل المقر (${attendanceStore.currentDistanceMeters}م)` : `خارج المقر (${attendanceStore.currentDistanceMeters}م)` }}
                </span>
                <span v-else>بانتظار التقاط الموقع</span>
              </div>
            </div>
          </div>

          <span
            v-if="attendanceStore.currentDistanceMeters !== null"
            class="text-[10px] px-1.5 py-0.5 rounded-md font-extrabold"
            :class="attendanceStore.isInsideGeofence ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
          >
            {{ attendanceStore.isInsideGeofence ? 'مصرح' : 'تجاوز' }}
          </span>
        </div>

        <!-- 3. Time Window Gating -->
        <div
          class="p-2.5 rounded-2xl border flex items-center justify-between gap-2"
          :class="attendanceStore.attendanceWindow?.canCheckIn || attendanceStore.attendanceWindow?.canCheckOut
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
            : 'bg-slate-50 border-slate-200 text-slate-700'"
        >
          <div class="flex items-center gap-2 min-w-0">
            <Clock class="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
            <div class="truncate">
              <div class="text-[10px] font-bold opacity-75">موعد الوردية</div>
              <div class="text-xs font-extrabold truncate">
                {{ attendanceStore.attendanceWindow?.canCheckIn || attendanceStore.attendanceWindow?.canCheckOut ? 'ضمن الوقت المصرح به' : 'خارج نافذة التسجيل' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Device Binding Status -->
        <div
          class="p-2.5 rounded-2xl border flex items-center justify-between gap-2"
          :class="attendanceStore.deviceBinding?.isBound
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'"
        >
          <div class="flex items-center gap-2 min-w-0">
            <Smartphone class="w-3.5 h-3.5 flex-shrink-0" :class="attendanceStore.deviceBinding?.isBound ? 'text-emerald-600' : 'text-amber-600'" />
            <div class="truncate">
              <div class="text-[10px] font-bold opacity-75">اقتران الهاتف</div>
              <div class="text-xs font-extrabold truncate">
                {{ attendanceStore.deviceBinding?.isBound ? 'هاتفك معتمد ومقترن' : 'هاتف جديد غير معتمد' }}
              </div>
            </div>
          </div>

          <q-btn
            v-if="!attendanceStore.deviceBinding?.isBound"
            unelevated
            dense
            no-caps
            label="اعتماد الهاتف"
            @click="showPairModal = true"
            class="text-[10px] px-2.5 py-0.5 rounded-lg font-bold shadow-xs flex-shrink-0"
            style="background-color: #F59E0B !important; color: #ffffff !important;"
          />
        </div>
      </div>
    </div>

    <!-- Main Attendance Action Card -->
    <div class="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 text-center">
      <!-- Status Badge -->
      <div
        class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold"
        :class="attendanceStore.isCheckedIn
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : (attendanceStore.hasCheckedOut ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600 border border-slate-200/60')"
      >
        <span
          class="w-2 h-2 rounded-full"
          :class="attendanceStore.isCheckedIn ? 'bg-emerald-500 animate-pulse' : (attendanceStore.hasCheckedOut ? 'bg-blue-500' : 'bg-slate-400')"
        ></span>
        <span>
          {{ attendanceStore.isCheckedIn ? 'تم إثبات الحضور (دوام نشط حالياً)' : (attendanceStore.hasCheckedOut ? 'تم تسجيل الانصراف لهذه الوردية' : 'بانتظار تسجيل الحضور') }}
        </span>
      </div>

      <!-- Active Attendance Info -->
      <div v-if="attendanceStore.isCheckedIn" class="space-y-1 py-1">
        <p class="text-xs text-slate-400 font-bold">وقت الدخول الموثق</p>
        <p class="text-2xl font-black text-slate-900 font-mono">{{ formatTime(attendanceStore.checkInTime) }}</p>
        <div class="flex items-center justify-center gap-2 text-xs text-brand-navy font-bold mt-1">
          <MapPin class="w-3.5 h-3.5 text-brand-cyan" />
          <span>مقر العمل: {{ attendanceStore.branchName || 'الفرع الرئيسي' }}</span>
        </div>
        <div v-if="attendanceStore.durationFormatted" class="text-xs text-slate-500 font-semibold pt-1">
          إجمالي التواجد حتى الآن: <span class="font-bold text-slate-800">{{ attendanceStore.durationFormatted }}</span>
        </div>
      </div>

      <!-- Completed Check-Out Summary -->
      <div v-else-if="attendanceStore.hasCheckedOut" class="space-y-1 py-1">
        <p class="text-xs text-slate-400 font-bold">آخر وقت انصراف موثق</p>
        <p class="text-2xl font-black text-slate-900 font-mono">{{ formatTime(attendanceStore.checkOutTime) }}</p>
        <div v-if="attendanceStore.durationFormatted" class="text-xs text-emerald-700 font-bold bg-emerald-50 py-1.5 px-3.5 rounded-xl inline-block mt-1 border border-emerald-200/60">
          إجمالي ساعات التواجد: {{ attendanceStore.durationFormatted }}
        </div>
      </div>

      <!-- Giant Interactive Biometric & GPS Attendance Button (Gated) -->
      <div class="py-4 flex flex-col items-center">
        <!-- Check-In Button -->
        <template v-if="!attendanceStore.isCheckedIn">
          <!-- Active Enabled Button -->
          <button
            v-if="attendanceStore.canPunch"
            @click="handleCheckIn"
            :disabled="attendanceStore.isLoading"
            class="w-44 h-44 rounded-full bg-gradient-to-tr from-[#313C8E] via-indigo-600 to-[#1E255E] text-white flex flex-col items-center justify-center p-4 shadow-2xl shadow-[#313C8E]/40 border-4 border-white/90 active:scale-95 transition-all cursor-pointer touch-target-48 relative group"
          >
            <div class="absolute inset-0 rounded-full border-2 border-brand-cyan animate-ping opacity-30 pointer-events-none"></div>
            <Fingerprint class="w-16 h-16 text-white mb-2 group-hover:scale-110 transition-transform" />
            <span class="text-sm font-black tracking-tight">اضغط للبصمة</span>
            <span class="text-[10px] text-sky-200 font-semibold mt-0.5">إثبات الحضور (GPS)</span>
          </button>

          <!-- Disabled Gated Button -->
          <div
            v-else
            class="w-44 h-44 rounded-full bg-slate-100 border-4 border-slate-200 text-slate-400 flex flex-col items-center justify-center p-4 shadow-inner opacity-80 cursor-not-allowed select-none relative"
            :title="attendanceStore.punchDisabledReason || 'البصمة غير متاحة حالياً'"
          >
            <Lock class="w-12 h-12 text-slate-400 mb-2" />
            <span class="text-xs font-black text-slate-600 text-center">البصمة مقفولة</span>
            <span class="text-[9px] text-slate-400 font-bold text-center mt-1 max-w-[120px] leading-tight">
              {{ attendanceStore.punchDisabledReason || 'خارج موعد الوردية' }}
            </span>
          </div>
        </template>

        <!-- Check-Out Button -->
        <template v-else>
          <!-- Active Enabled Check-out Button -->
          <button
            v-if="attendanceStore.canPunch"
            @click="handleCheckOut"
            :disabled="attendanceStore.isLoading"
            class="w-44 h-44 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex flex-col items-center justify-center p-4 shadow-2xl shadow-orange-500/30 border-4 border-white/90 active:scale-95 transition-all cursor-pointer touch-target-48 relative group"
          >
            <div class="absolute inset-0 rounded-full border-2 border-orange-300 animate-pulse opacity-40 pointer-events-none"></div>
            <LogOut class="w-14 h-14 text-white mb-2 group-hover:scale-110 transition-transform" />
            <span class="text-sm font-black tracking-tight">تسجيل الانصراف</span>
            <span class="text-[10px] text-orange-100 font-semibold mt-0.5">توثيق نهاية الدوام</span>
          </button>

          <!-- Disabled Check-out Button -->
          <div
            v-else
            class="w-44 h-44 rounded-full bg-slate-100 border-4 border-slate-200 text-slate-400 flex flex-col items-center justify-center p-4 shadow-inner opacity-80 cursor-not-allowed select-none"
          >
            <Lock class="w-12 h-12 text-slate-400 mb-2" />
            <span class="text-xs font-black text-slate-600">الانصراف غير متاح</span>
            <span class="text-[9px] text-slate-400 font-bold text-center mt-1 max-w-[120px] leading-tight">
              {{ attendanceStore.punchDisabledReason || 'غير مصرح بالانصراف الآن' }}
            </span>
          </div>
        </template>
      </div>

      <!-- Human-friendly Status Explanation Banner under button -->
      <div
        v-if="!attendanceStore.canPunch && attendanceStore.punchDisabledReason"
        class="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-bold flex items-center justify-center gap-2"
      >
        <AlertCircle class="w-4 h-4 flex-shrink-0 text-amber-600" />
        <span>{{ attendanceStore.punchDisabledReason }}</span>
      </div>

      <!-- Error message alert with direct action -->
      <div
        v-if="attendanceStore.lastError"
        class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-right flex items-start justify-between gap-2"
      >
        <div class="flex items-start gap-2 min-w-0">
          <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{{ attendanceStore.lastError }}</span>
        </div>

        <button
          v-if="attendanceStore.lastError.includes('موقع') || attendanceStore.lastError.includes('GPS')"
          @click="showGpsHelpModal = true"
          class="px-2 py-1 bg-white rounded-lg border border-rose-300 text-[10px] font-black text-rose-700 flex-shrink-0 hover:bg-rose-100 cursor-pointer"
        >
          كيف أحل المشكلة؟
        </button>
      </div>

      <!-- Success message alert -->
      <div
        v-if="successMsg"
        class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-right flex items-start gap-2"
      >
        <CheckCircle2 class="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{{ successMsg }}</span>
      </div>
    </div>

    <!-- Today's Attendance Timeline / Log List -->
    <div v-if="attendanceStore.todayLogs && attendanceStore.todayLogs.length > 0" class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
      <div class="flex items-center gap-2 text-slate-800 font-bold text-sm">
        <History class="w-4 h-4 text-brand-navy" />
        <span>سجل حركات اليوم الموثقة</span>
      </div>

      <div class="divide-y divide-slate-100">
        <div
          v-for="log in attendanceStore.todayLogs"
          :key="log.id"
          class="py-2.5 flex items-center justify-between text-xs"
        >
          <div class="flex items-center gap-2">
            <div
              class="w-7 h-7 rounded-lg flex items-center justify-center"
              :class="log.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'"
            >
              <Fingerprint v-if="log.status === 'APPROVED'" class="w-4 h-4" />
              <LogOut v-else class="w-4 h-4" />
            </div>
            <div>
              <div class="font-bold text-slate-900">
                {{ log.status === 'APPROVED' ? 'تسجيل حضور' : 'تسجيل انصراف' }}
              </div>
              <div class="text-[10px] text-slate-400">
                {{ log.branchName || 'مقر المركز' }}
              </div>
            </div>
          </div>

          <div class="text-left font-black text-slate-700 font-mono">
            {{ formatTime(log.time) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Security & Institutional Note -->
    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3 text-xs text-slate-600 font-medium">
      <ShieldCheck class="w-5 h-5 text-brand-navy flex-shrink-0" />
      <span>
        يتم توثيق الحضور والانصراف آلياً عبر مطابقة البصمة الحيوية وإحداثيات النطاق الجغرافي لفرع المركز المعتمد.
      </span>
    </div>

    <!-- Modal 1: GPS Guide for Non-Technical Employee -->
    <div
      v-if="showGpsHelpModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans"
    >
      <div class="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4 text-right">
        <div class="flex items-center justify-between border-b pb-3">
          <div class="flex items-center gap-2 text-slate-900 font-black text-sm">
            <HelpCircle class="w-5 h-5 text-brand-navy" />
            <span>كيفية تفعيل الموقع الجغرافي (GPS)</span>
          </div>
          <button @click="showGpsHelpModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <p class="text-xs text-slate-500 font-semibold leading-relaxed">
          لتسجيل الحضور والانصراف، يحتاج هاتفك إلى تفعيل خدمة تحديد الموقع. اتبع هذه الخطوات البسيطة:
        </p>

        <div class="space-y-2.5 text-xs text-slate-700">
          <div class="p-2.5 rounded-xl bg-slate-50 border flex items-start gap-2.5">
            <span class="w-5 h-5 rounded-full bg-brand-navy text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">1</span>
            <div>
              <p class="font-bold text-slate-900">اسحب شريط الإشعارات</p>
              <p class="text-[11px] text-slate-500 mt-0.5">اسحب من أعلى شاشة الهاتف لأسفل لفتح لوحة الاختصارات السريعة.</p>
            </div>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-50 border flex items-start gap-2.5">
            <span class="w-5 h-5 rounded-full bg-brand-navy text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">2</span>
            <div>
              <p class="font-bold text-slate-900">فعّل أيقونة «الموقع / Location / GPS»</p>
              <p class="text-[11px] text-slate-500 mt-0.5">تأكد من إضاءة أيقونة الموقع باللون الأزرق أو الأخضر.</p>
            </div>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-50 border flex items-start gap-2.5">
            <span class="w-5 h-5 rounded-full bg-brand-navy text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">3</span>
            <div>
              <p class="font-bold text-slate-900">الموافقة على الصلاحية</p>
              <p class="text-[11px] text-slate-500 mt-0.5">عند ظهور رسالة الإذن، اختر «أثناء استخدام التطبيق فقط» مع تفعيل الموقع الدقيق.</p>
            </div>
          </div>
        </div>

        <div class="pt-2 flex gap-2">
          <q-btn
            unelevated
            no-caps
            label="تأكيد وإعادة فحص الموقع"
            color="primary"
            @click="handleRecheckGpsAndCloseModal"
            class="w-full py-2.5 rounded-xl font-black text-xs shadow-md"
            style="background-color: #313C8E !important; color: #ffffff !important;"
          />
        </div>
      </div>
    </div>

    <!-- Modal 2: Device Pairing Confirmation Modal -->
    <div
      v-if="showPairModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans"
    >
      <div class="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4 text-right">
        <div class="flex items-center justify-between border-b pb-3">
          <div class="flex items-center gap-2 text-slate-900 font-black text-sm">
            <Smartphone class="w-5 h-5 text-amber-500" />
            <span>اعتماد واقتران هذا الهاتف</span>
          </div>
          <button @click="showPairModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
        </div>

        <div class="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed font-semibold">
          لحماية بياناتك، يتم تخصيص هاتف محدد لكل موظف لتسجيل الدوام. بالضغط على زر الاعتماد أدناه، سيتم تسجيل هذا الهاتف كجهازك الأساسي المعتمد بالمركز.
        </div>

        <div class="pt-2 flex gap-2.5 items-center">
          <q-btn
            flat
            no-caps
            label="إلغاء"
            @click="showPairModal = false"
            class="flex-1 py-2.5 rounded-xl text-xs font-bold"
            style="background-color: #F1F5F9 !important; color: #334155 !important; font-weight: 700 !important;"
          />
          <q-btn
            unelevated
            no-caps
            label="تأكيد اعتماد الهاتف"
            :loading="attendanceStore.isLoading"
            @click="handleConfirmPairDevice"
            class="flex-1 py-2.5 rounded-xl text-xs font-black shadow-md"
            style="background-color: #313C8E !important; color: #ffffff !important; font-weight: 800 !important;"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAttendanceStore } from '../../stores/attendance.store';
import {
  Fingerprint,
  LogOut,
  ShieldCheck,
  Moon,
  Sun,
  MapPin,
  AlertCircle,
  CheckCircle2,
  History,
  Clock,
  Lock,
  RefreshCw,
  HelpCircle,
  Smartphone,
} from 'lucide-vue-next';

const attendanceStore = useAttendanceStore();
const successMsg = ref<string | null>(null);
const showGpsHelpModal = ref(false);
const showPairModal = ref(false);

onMounted(() => {
  attendanceStore.fetchTodayStatus();
});

async function handleRecheckGps() {
  await attendanceStore.checkReadiness();
}

async function handleRecheckGpsAndCloseModal() {
  showGpsHelpModal.value = false;
  await attendanceStore.checkReadiness();
}

async function handleConfirmPairDevice() {
  const res = await attendanceStore.pairCurrentDevice();
  if (res.success) {
    showPairModal.value = false;
  }
}

async function handleCheckIn() {
  successMsg.value = null;
  const res = await attendanceStore.performSmartCheckIn();
  if (res.success) {
    successMsg.value = res.message;
  }
}

async function handleCheckOut() {
  successMsg.value = null;
  const res = await attendanceStore.performCheckOut();
  if (res.success) {
    successMsg.value = res.message;
  }
}

function formatTime(t?: string | null) {
  if (!t) return '--:--';
  return new Date(t).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}
</script>
