import { boot } from 'quasar/wrappers';
import axios from 'axios';

// Create axios instance
const api = axios.create({
  //baseURL: 'http://localhost:9080',  // Change this to your backend host and port
  baseURL: 'https://pfadminapi.palingfestival.be',
});

export default boot(({ app }) => {
  // Make Axios globally available
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
