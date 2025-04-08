<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-md" style="max-width: 400px; margin: auto">
      <div class="text-h5 q-mb-md">Account verificatie</div>
      <div v-if="loading" class="text-center">
        <q-spinner size="50px" color="primary" />
        <div>Uw account wordt geverifieerd...</div>
      </div>
      <div v-else>
        <div class="text-subtitle1 q-mb-md">{{ message }}</div>
        <q-btn v-if="verified" label="Ga naar inloggen" color="primary" @click="goToLogin" />
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: 'VerifyEmail',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const message = ref('')
    const loading = ref(true)
    const verified = ref(false)
    const token = route.query.token

    onMounted(async () => {
      if (!token) {
        message.value = 'Geen token gevonden'
        loading.value = false
        return
      }
      try {
        // Call the GET /verify-email endpoint with the token.
        const response = await api.get('/verify-email', { params: { token: token } })
        // The backend might return a plain text or JSON message.
        message.value = response.data || 'Account geverifieerd.'
        // If you check for a specific success message, you might update verified.
        if (response.data === 'Account verified successfully.') {
          verified.value = true
        }
      } catch (error) {
        message.value = 'Er is een fout opgetreden tijdens verificatie.'
        console.log(error)
      } finally {
        loading.value = false
      }
    })

    const goToLogin = () => {
      router.push('/auth/login')
    }

    return { message, loading, verified, goToLogin }
  },
}
</script>

<style scoped>
/* Add additional styling as needed */
</style>
