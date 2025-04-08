import { route } from 'quasar/wrappers';
import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { useAuthStore } from 'stores/auth';

export default route(function () {
  const Router = createRouter({
    history: createWebHistory(),
    routes,
  });

  Router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      next('/auth/login');  // Redirect to login if not authenticated
    } else {
      next();
    }
  });

  return Router;
});
