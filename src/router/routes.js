const routes = [
  {
    path: '/auth',
    component: () => import('layouts/MinimalLayout.vue'),
    children: [
      {
        path: 'login',
        component: () => import('pages/loginPage.vue'),
      },
      
    ],
  }, 
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: 'dashboard',
        component: () => import('pages/dashboardPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/reset-password',
    component: () => import('layouts/MinimalLayout.vue'),
    children: [
      { path: '', component: () => import('pages/ResetPassword.vue') }
    ]
  },
  
  {
    path: '/verify-email',
    component: () => import('layouts/MinimalLayout.vue'),
    children: [
      { path: '', component: () => import('pages/VerifyEmail.vue') }
    ]
  },
  
  {
    path: '/new-medewerker',
    component: () => import('pages/newMedewerkerform.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/errorPage.vue'),
  },
];

export default routes;
