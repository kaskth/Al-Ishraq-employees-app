import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiClient } from '../api/client';
import { showErrorNotification, showSuccessNotification } from '../utils/errorHandler';

export interface AssessmentTemplate {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  category: string;
  targetAgeMinMonths: number;
  targetAgeMaxMonths: number;
  description: string;
  instructions: string;
  items?: any[];
}

export interface AssessmentAnswer {
  itemCode: string;
  domainName: string;
  scoreValue: number;
  scoreLabel?: string;
  itemAgeBracket?: string;
  clinicalNote?: string;
}

export interface AssessmentRecord {
  id: number;
  childId: number;
  child?: any;
  templateId: number;
  template?: any;
  employeeId: number;
  employee?: any;
  status: 'DRAFT' | 'FINALIZED' | 'ARCHIVED';
  evaluationDate: string;
  childAgeMonthsAtEval: number;
  rawScoreTotal?: number;
  standardScore?: number;
  developmentalAgeMonths?: number;
  severityLevel?: string;
  classificationText?: string;
  radarDataJson?: string;
  radarData?: any[];
  clinicalNotes?: string;
  recommendations?: string;
  examinerName?: string;
  examinerTitle?: string;
  isLocked: boolean;
  finalizedAt?: string;
  itemScores?: any[];
  iepGoals?: any[];
  templateItems?: any[];
}

export const useClinicalAssessmentsStore = defineStore('clinicalAssessments', () => {
  const templates = ref<AssessmentTemplate[]>([]);
  const childAssessments = ref<AssessmentRecord[]>([]);
  const currentRecord = ref<AssessmentRecord | null>(null);
  const reportData = ref<any | null>(null);

  const isLoading = ref(false);
  const isSavingDraft = ref(false);
  const lastSavedAt = ref<Date | null>(null);

  // 1. Fetch available assessment templates
  async function fetchTemplates() {
    isLoading.value = true;
    try {
      const res = await apiClient.get('/clinical-assessments/templates');
      if (res.data.status) {
        templates.value = res.data.data;
      }
    } catch (err: any) {
      showErrorNotification(err, 'فشل تحميل قائمة المقاييس');
    } finally {
      isLoading.value = false;
    }
  }

  // 2. Fetch all assessments for a specific child
  async function fetchChildAssessments(childId: number) {
    isLoading.value = true;
    try {
      const res = await apiClient.get(`/clinical-assessments/child/${childId}`);
      if (res.data.status) {
        childAssessments.value = res.data.data;
      }
    } catch (err: any) {
      showErrorNotification(err, 'فشل تحميل سجل تقييمات الطفل');
    } finally {
      isLoading.value = false;
    }
  }

  // 3. Fetch specific assessment record details
  async function fetchRecord(recordId: number) {
    isLoading.value = true;
    try {
      const res = await apiClient.get(`/clinical-assessments/records/${recordId}`);
      if (res.data.status) {
        currentRecord.value = res.data.data;
      }
      return res.data.data;
    } catch (err: any) {
      showErrorNotification(err, 'فشل تحميل بيانات جلسة التقييم');
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // 4. Start a new assessment
  async function startAssessment(payload: {
    childId: number;
    templateCode: string;
    examinerName?: string;
    examinerTitle?: string;
    notes?: string;
  }) {
    isLoading.value = true;
    try {
      const res = await apiClient.post(`/clinical-assessments/child/${payload.childId}/start`, {
        templateCode: payload.templateCode,
        examinerName: payload.examinerName,
        examinerTitle: payload.examinerTitle,
        notes: payload.notes,
      });

      if (res.data.status) {
        showSuccessNotification(res.data.message || 'تم فتح جلسة التقييم بنجاح');
        await fetchChildAssessments(payload.childId);
        return res.data.data;
      }
      throw new Error(res.data.message || 'فشل فتح جلسة التقييم');
    } catch (err: any) {
      showErrorNotification(err, 'تعذر بدء جلسة التقييم');
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // 5. Auto-Save draft (silent background update)
  async function saveDraft(
    recordId: number,
    answers: AssessmentAnswer[],
    clinicalNotes?: string,
    recommendations?: string,
  ) {
    isSavingDraft.value = true;
    try {
      const res = await apiClient.patch(`/clinical-assessments/records/${recordId}/auto-save`, {
        answers,
        clinicalNotes,
        recommendations,
      });

      if (res.data.status) {
        lastSavedAt.value = new Date();
        if (currentRecord.value && res.data.data.preview) {
          currentRecord.value.rawScoreTotal = res.data.data.preview.rawScoreTotal;
          currentRecord.value.standardScore = res.data.data.preview.standardScore;
          currentRecord.value.severityLevel = res.data.data.preview.severityLevel;
          currentRecord.value.developmentalAgeMonths = res.data.data.preview.developmentalAgeMonths;
        }
        return res.data.data;
      }
    } catch (err: any) {
      // Silent error in background, do not interrupt specialist
      console.warn('Auto-save background draft failed:', err);
    } finally {
      isSavingDraft.value = false;
    }
  }

  // 6. Finalize assessment and calculate score
  async function finalizeAssessment(payload: {
    recordId: number;
    answers: AssessmentAnswer[];
    clinicalNotes?: string;
    recommendations?: string;
    examinerName?: string;
    examinerTitle?: string;
  }) {
    isLoading.value = true;
    try {
      const res = await apiClient.post(`/clinical-assessments/records/${payload.recordId}/finalize`, {
        answers: payload.answers,
        clinicalNotes: payload.clinicalNotes,
        recommendations: payload.recommendations,
        examinerName: payload.examinerName,
        examinerTitle: payload.examinerTitle,
      });

      if (res.data.status) {
        showSuccessNotification(res.data.message || 'تم اعتماد وتوثيق التقييم بنجاح');
        currentRecord.value = res.data.data.record;
        return res.data.data;
      }
      throw new Error(res.data.message || 'فشل اعتماد التقييم');
    } catch (err: any) {
      showErrorNotification(err, 'فشل اعتماد التقييم');
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // 7. Export failed items to IEP
  async function exportIepGoals(recordId: number, itemCodes: string[], targetTerm = 'TERM_1') {
    isLoading.value = true;
    try {
      const res = await apiClient.post(`/clinical-assessments/records/${recordId}/export-iep`, {
        itemCodes,
        targetTerm,
      });

      if (res.data.status) {
        showSuccessNotification(res.data.message || 'تم تحويل المهارات بنجاح إلى الخطة الفردية');
        return res.data.data;
      }
      throw new Error(res.data.message);
    } catch (err: any) {
      showErrorNotification(err, 'فشل تصدير الأهداف للخطة الفردية');
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // 8. Fetch official printable report
  async function fetchReportData(recordId: number) {
    isLoading.value = true;
    try {
      const res = await apiClient.get(`/clinical-assessments/records/${recordId}/report`);
      if (res.data.status) {
        reportData.value = res.data.data;
        return res.data.data;
      }
    } catch (err: any) {
      showErrorNotification(err, 'فشل تحميل التقرير الطبي');
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    templates,
    childAssessments,
    currentRecord,
    reportData,
    isLoading,
    isSavingDraft,
    lastSavedAt,
    fetchTemplates,
    fetchChildAssessments,
    fetchRecord,
    startAssessment,
    saveDraft,
    finalizeAssessment,
    exportIepGoals,
    fetchReportData,
  };
});
