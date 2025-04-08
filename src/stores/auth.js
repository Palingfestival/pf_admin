import { defineStore } from 'pinia';

// In-memory storage for fallback
let memoryToken = null;
let memoryUser = null;
let memoryVereniging = null;
let memoryPer_identificatie = null;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,  // Token in Pinia state
    user: null,   // User info in Pinia state
    vereninging: null,
    per_identificatie: null,
  }),
  actions: {
    setToken(newToken) {
      memoryToken = newToken;  // Store token in memory
      this.token = newToken;  // Update Pinia state
    },
    clearToken() {
      memoryToken = null;  // Clear in-memory token
      this.token = null;  // Clear Pinia state
    },
    setUser(userData) {
      memoryUser = userData.username;  // Store user data in memory
      this.user = userData.username;  // Update Pinia state
      memoryVereniging = userData.vereninging;
      this.vereniging = userData.vereniging;
      memoryPer_identificatie = userData.per_identificatie
      this.per_identificatie = userData.per_identificatie
    },
    clearUser() {
      memoryUser = null;  // Clear in-memory user
      this.user = null;  // Clear Pinia state
      memoryVereniging = null;
      this.vereniging = null;
      memoryPer_identificatie = null;
      this.per_identificatie = null;
    },
    loadToken() {
      // Load token and user info from memory
      this.token = memoryToken;
      this.user = memoryUser;
      this.vereniging = memoryVereniging
      this.per_identificatie = memoryPer_identificatie
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.token,  // Returns true if a token is set
  },
});
