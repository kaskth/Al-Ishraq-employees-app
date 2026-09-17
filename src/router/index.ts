import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const routes: RouteRecordRaw[] = [
  {
    path: '/splash',
    name: 'IntroSplash',
    component: () => import('../views/IntroSplashView.vue'),
    meta: { public: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        redirect: () => {
          const auth = useAuthStore();
          if (auth.isAdmin) return '/admin/dashboard';
          if (auth.isWorker) return '/worker/dashboard';
          return '/specialist/dashboard';
        },
      },
      // Specialist Routes
      {
        path: 'specialist/dashboard',
        name: 'SpecialistDashboard',
        component: () => import('../views/specialist/SpecialistDashboardView.vue'),
        meta: { role: 'SPECIALIST' },
      },
      {
        path: 'specialist/my-children',
        name: 'SpecialistChildren',
        component: () => import('../views/specialist/MyChildrenView.vue'),
        meta: { role: 'SPECIALIST' },
      },
      {
        path: 'specialist/children/:id',
        name: 'ChildIep',
        component: () => import('../views/specialist/ChildIepView.vue'),
        meta: { role: 'SPECIALIST' },
      },
      {
        path: 'specialist/child/:childId/assessment/:recordId/runner',
        name: 'AssessmentRunner',
        component: () => import('../views/specialist/assessments/AssessmentRunnerView.vue'),
        meta: { role: 'SPECIALIST' },
      },
      {
        path: 'specialist/child/:childId/assessment/:recordId/report',
        name: 'AssessmentReport',
        component: () => import('../views/specialist/assessments/AssessmentReportView.vue'),
        meta: { role: 'SPECIALIST' },
      },
      {
        path: 'specialist/attendance',
        name: 'SpecialistAttendance',
        component: () => import('../views/shared/AttendanceView.vue'),
        meta: { role: 'SPECIALIST' },
      },
      {
        path: 'specialist/profile',
        name: 'SpecialistProfile',
        component: () => import('../views/shared/ProfileView.vue'),
        meta: { role: 'SPECIALIST' },
      },

      // Admin Routes
      {
        path: 'admin/dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/admin/AdminDashboardView.vue'),
        meta: { role: 'ADMIN' },
      },
      {
        path: 'admin/approvals',
        name: 'AdminApprovals',
        component: () => import('../views/admin/AdminApprovalsView.vue'),
        meta: { role: 'ADMIN' },
      },
      {
        path: 'admin/attendance',
        name: 'AdminAttendance',
        component: () => import('../views/shared/AttendanceView.vue'),
        meta: { role: 'ADMIN' },
      },
      {
        path: 'admin/profile',
        name: 'AdminProfile',
        component: () => import('../views/shared/ProfileView.vue'),
        meta: { role: 'ADMIN' },
      },

      // Worker Routes
      {
        path: 'worker/dashboard',
        name: 'WorkerDashboard',
        component: () => import('../views/worker/WorkerDashboardView.vue'),
        meta: { role: 'SUPPORT_WORKER' },
      },
      {
        path: 'worker/leaves',
        name: 'WorkerLeaves',
        component: () => import('../views/worker/WorkerLeavesView.vue'),
        meta: { role: 'SUPPORT_WORKER' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to, _from, next) => {
  const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
  if (!hasSeenSplash && to.path !== '/splash') {
    next('/splash');
    return;
  }

  const authStore = useAuthStore();

  if (!to.meta.public && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/');
  } else if (to.meta.role && to.meta.role !== authStore.role && !authStore.isAdmin) {
    // If not matching role, redirect to appropriate home
    next('/');
  } else {
    next();
  }
});
