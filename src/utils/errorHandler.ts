import { Notify } from 'quasar';

export function getErrorMessage(error: any): string {
  if (!error) return 'حدث خطأ غير متوقع';

  // 1. Check Geolocation and GPS errors explicitly FIRST
  const errCode = error?.code;
  const errMsg = String(error?.message || '').toLowerCase();

  if (
    errCode === 1 ||
    errMsg.includes('denied') ||
    errMsg.includes('permission')
  ) {
    return 'تم رفض إذن الوصول للموقع الجغرافي. يرجى منح إذن الموقع للتطبيق من إعدادات الهاتف لتسجيل الحضور.';
  }

  if (
    errCode === 2 ||
    errMsg.includes('unavailable') ||
    errMsg.includes('disabled') ||
    errMsg.includes('services are not enabled') ||
    errMsg.includes('location service')
  ) {
    return 'خدمة تحديد الموقع (GPS) مغلقة على هاتفك. يرجى سحب شريط الإشعارات وتفعيل الموقع الجغرافي ثم المحاولة.';
  }

  if (errCode === 3 || errMsg.includes('timeout') || errMsg.includes('timed out')) {
    return 'استغرق تحديد موقعك الجغرافي وقتاً أطول من المعتاد. يرجى التأكد من تفعيل دقة الموقع العالية وإعادة المحاولة.';
  }

  if (errMsg.includes('location') || errMsg.includes('geolocation') || errMsg.includes('gps')) {
    return 'تعذر التقاط إحداثيات موقعك الجغرافي (GPS). يرجى التأكد من تفعيل خدمة الموقع على الهاتف والموافقة على الصلاحية.';
  }

  // 2. HTTP response errors from backend
  if (error.response?.data) {
    const data = error.response.data;

    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.join(' • ');
    }

    if (data.message) {
      if (Array.isArray(data.message)) {
        return data.message.join(' • ');
      }
      return data.message;
    }
  }

  // 3. HTTP status codes
  if (error.response?.status === 403) {
    return 'ليس لديك الصلاحية لتنفيذ هذا الإجراء أو الحساب مقترن بجهاز آخر';
  }

  if (error.response?.status === 404) {
    return 'البيانات المطلوبة غير موجودة أو تم حذفها';
  }

  // 4. Network errors
  if (error.message === 'Network Error' || (error.isAxiosError && !error.response)) {
    return 'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت';
  }

  return error.message || 'حدث خطأ غير متوقع';
}

export function showErrorNotification(error: any, caption?: string) {
  const message = getErrorMessage(error);
  Notify.create({
    type: 'negative',
    message,
    caption: caption || 'تنبيه خطأ',
    position: 'top',
    timeout: 4500,
    progress: true,
    actions: [{ icon: 'close', color: 'white', round: true }],
  });
}

export function showSuccessNotification(message: string, caption?: string) {
  Notify.create({
    type: 'positive',
    message,
    caption: caption || 'تم بنجاح',
    position: 'top',
    timeout: 3000,
    progress: true,
    actions: [{ icon: 'check', color: 'white', round: true }],
  });
}
