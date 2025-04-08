<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-md" style="max-width: 400px; margin: auto">
      <div class="text-h5 q-mb-md">Reset uw wachtwoord</div>
      <q-form @submit.prevent="submitReset">
        <q-input v-model="newPassword" type="password" label="Nieuw wachtwoord" outlined required />
        <q-input
          v-model="confirmPassword"
          type="password"
          label="Bevestig wachtwoord"
          outlined
          required
          class="q-mt-md"
        />
        <div v-if="errorMessage" class="text-negative q-mt-sm">{{ errorMessage }}</div>
        <q-btn label="Reset wachtwoord" type="submit" color="primary" class="full-width q-mt-md" />
      </q-form>
    </div>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: 'ResetPassword',
  setup() {
    const $q = useQuasar()
    const router = useRouter()
    const route = useRoute()
    const newPassword = ref('')
    const confirmPassword = ref('')
    const errorMessage = ref('')
    const token = route.query.token // Get token from URL query

    const submitReset = async () => {
      errorMessage.value = ''
      if (newPassword.value !== confirmPassword.value) {
        errorMessage.value = 'Wachtwoorden komen niet overeen'
        return
      }
      try {
        const response = await api.post('/reset-password/confirm', {
          token: token,
          newPassword: newPassword.value,
        })
        if (response.data.success) {
          $q.notify({
            type: 'positive',
            message: 'Wachtwoord succesvol gereset. U kunt nu inloggen.',
          })
          router.push('/auth/login')
        } else {
          errorMessage.value = 'Er is een fout opgetreden tijdens het resetten'
        }
      } catch (error) {
        errorMessage.value = 'Er is een fout opgetreden: ' + error.message
      }
    }

    return { newPassword, confirmPassword, submitReset, errorMessage }
  },
}
</script>

<style scoped>
/* Add additional styling as needed */
</style>
