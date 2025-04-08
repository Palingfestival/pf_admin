import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

export default ({ app }) => {
  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);  // Enable persistence
  app.use(pinia);
};
