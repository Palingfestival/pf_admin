<template>
  <!-- Use a QPage with a gradient background -->
  <q-page class="login-page flex flex-center">
    <!-- Container to hold the card in the center of the screen -->
    <div class="login-container q-pa-md">
      <!-- Card with a translucent white background to make text stand out -->
      <q-card class="my-card" flat bordered>
        <!-- Logo and title -->
        <q-card-section class="text-center">
          <!-- Replace this with your festival’s logo or the stylized variant -->
          <img src="../assets/logopf.jpeg" alt="Festival Logo" class="login-logo" />
          <div class="text-h5 q-mt-md">Palingfestival Pinksterdagen Mariekerke</div>
          <div class="text-subtitle2 text-grey-7 q-mt-xs">
            Welkom, gelieve in te loggen om verder te gaan.
          </div>
        </q-card-section>

        <!-- Form fields and button -->
        <q-card-section>
          <q-form @submit.prevent="login" class="q-gutter-md">
            <q-input v-model="username" label="Gebruikersnaam" />
            <q-input
              v-model="password"
              type="password"
              label="Paswoord"
              :rules="[(val) => !!val || 'Gelieve een paswoord in te geven']"
            />
            <q-btn label="Log In" type="submit" color="primary" class="full-width" rounded />
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { useAuthStore } from 'stores/auth'
import { api } from 'boot/axios'
import { Notify } from 'quasar'
import { Dialog } from 'quasar'

export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      // Variables for the signup dialog
      showSignupDialog: false,
      signupEmail: '',
      signupPassword: '',
      signupNaam: '',
      signupVoornaam: '',
      signupVereniging: null,
      signupGemeente: null,
      signupStraat: null,
      signupNr: '',
      signupTelefoon: '',
      signupGSM: '',
      signupGeboortedatum: '',
      signupOpmerking: '',
      // Options for dropdowns
      verenigingen: [],
      gemeenteOptions: [],
      straatOptions: [],
      // Example area codes for telefoon rule
      areaCodes: [
        '010',
        '011',
        '012',
        '013',
        '014',
        '015',
        '016',
        '019',
        '02',
        '03',
        '04',
        '050',
        '051',
        '052',
        '053',
        '054',
        '055',
        '056',
        '057',
        '058',
        '059',
        '060',
        '061',
        '063',
        '064',
        '065',
        '067',
        '068',
        '069',
        '071',
        '080',
        '081',
        '082',
        '083',
        '084',
        '085',
        '086',
        '087',
        '089',
        '09',
      ],
      // Variables for the forgot password dialog
      showForgotPasswordDialog: false,
      forgotPasswordEmail: '',
    }
  },
  created() {
    this.fetchVerenigingen()
  },

  methods: {
    async login() {
      const authStore = useAuthStore()
      try {
        const response = await api.post('/adminlogin', {
          gebruikersnaam: this.username,
          paswoord: this.password,
        })
        if (response.data.success) {
          console.log(response.data.user.per_identificatie)
          authStore.setToken(response.data.token)
          authStore.setUser({
            username: this.username,
            vereniging: response.data.user.vereniging,
            naam_vereniging: response.data.user.naam_vereniging,
            per_identificatie: response.data.user.per_identificatie,
          })
          // Log right away
          console.log('User before nextTick:', authStore.per_identificatie)

          // Or wait until Vue has updated the DOM/state
          this.$nextTick(() => {
            console.log('User after nextTick:', authStore.per_identificatie)
          })

          this.$router.push('/dashboard')
        } else {
          this.$q.notify({ type: 'negative', message: 'Invalid login!' })
        }
      } catch (error) {
        this.$q.notify({ type: 'negative', message: 'Login error: ' + error })
      }
    },

    openSignupDialog() {
      this.signupEmail = ''
      this.signupPassword = ''
      this.showSignupDialog = true
    },
    openForgotPasswordDialog() {
      this.forgotPasswordEmail = ''
      this.showForgotPasswordDialog = true
    },
    fetchVerenigingen() {
      // Fetch the list of organizations
      api
        .get('/verenigingen')
        .then((response) => {
          this.verenigingen = response.data
        })
        .catch((error) => {
          Notify.create({ type: 'negative', message: 'Fout bij ophalen verenigingen: ' + error })
        })
    },
    filterGemeente(val, update) {
      if (val.length < 2) {
        update()
        return
      }
      api
        .get(`/gemeente-search?zoek=${val.toUpperCase()}`)
        .then((response) => {
          this.gemeenteOptions = response.data.map((item) => ({
            label: item.gemeente,
            value: item.gemeente,
          }))
          update()
        })
        .catch((error) => {
          Notify.create({ type: 'negative', message: 'Fout bij ophalen gemeenten: ' + error })
          update()
        })
    },
    filterStraat(val, update) {
      if (val.length < 2) {
        update()
        return
      }
      let gemeenteValue = ''
      if (this.signupGemeente) {
        gemeenteValue =
          typeof this.signupGemeente === 'object' ? this.signupGemeente.value : this.signupGemeente
      }
      api
        .get(`/straat-search?gemeente=${gemeenteValue}&zoek=${val.toUpperCase()}`)
        .then((response) => {
          this.straatOptions = response.data.map((item) => ({
            label: item.straat,
            value: item.straat,
          }))
          update()
        })
        .catch((error) => {
          Notify.create({ type: 'negative', message: 'Fout bij ophalen straten: ' + error })
          update()
        })
    },
    async signup() {
      // Validate that all fields are filled (the QForm rules should help)
      if (
        !this.signupEmail ||
        !this.signupPassword ||
        !this.signupNaam ||
        !this.signupVoornaam ||
        !this.signupVereniging ||
        !this.signupGemeente ||
        !this.signupStraat ||
        !this.signupNr ||
        !this.signupGSM ||
        !this.signupGeboortedatum
      ) {
        Notify.create({ type: 'negative', message: 'Vul alle velden in.' })
        return
      }
      // Build payload; convert QSelect objects to strings if necessary
      const payload = {
        email: this.signupEmail,
        password: this.signupPassword,
        naam: this.signupNaam,
        voornaam: this.signupVoornaam,
        vereniging: this.signupVereniging,
        gemeente:
          typeof this.signupGemeente === 'object' ? this.signupGemeente.value : this.signupGemeente,
        straat: typeof this.signupStraat === 'object' ? this.signupStraat.value : this.signupStraat,
        nr: this.signupNr,
        gsm: this.signupGSM,
        geboortedatum: this.signupGeboortedatum,
      }
      try {
        // Example: send a verification email upon registration
        await api.post('/send-verification-email', payload)
        Dialog.create({
          title: 'Verificatie E-mail Verzonden',
          message:
            'Er is een verificatie e-mail verzonden naar ' +
            this.signupEmail +
            '. Controleer uw inbox (en spammap) en volg de instructies.',
        })
      } catch (error) {
        Notify.create({ type: 'negative', message: 'Fout tijdens registratie: ' + error })
      }
    },
    async forgotPassword() {
      // Close the dialog
      this.showForgotPasswordDialog = false
      try {
        // Check if the user exists
        let response = await api.post('/check-user', { email: this.forgotPasswordEmail })
        if (response.data.exists) {
          await this.resetPassword(this.forgotPasswordEmail)
          this.$q.dialog({
            title: 'Reset E-mail Verzonden',
            message:
              'Er is een reset e-mail verzonden naar ' +
              this.forgotPasswordEmail +
              '. Controleer uw inbox (en spammap) voor de e-mail met een link om uw wachtwoord opnieuw in te stellen.',
          })
        } else {
          this.$q.dialog({
            title: 'Geen Account Gevonden',
            message: 'Er bestaat geen account voor dit e-mail adres.',
          })
        }
      } catch (error) {
        this.$q.notify({ type: 'negative', message: 'Fout tijdens paswoord reset: ' + error })
      }
    },

    async resetPassword(email) {
      try {
        // Call the API endpoint that uses Postmark to send a reset email
        await api.post('/reset-password', { email })
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Fout tijdens het versturen van reset e-mail: ' + error,
        })
      }
    },
    async sendVerificationEmail(email, password) {
      try {
        // Call the API endpoint that sends a verification email via Postmark
        await api.post('/send-verification-email', { email, password })
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Fout tijdens het versturen van verificatie e-mail: ' + error,
        })
      }
    },
  },
}
</script>

<style scoped>
/* Full-page gradient background inspired by the poster’s blue palette */
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #003366 0%, #0066cc 100%);
}

/* Center the card nicely on the page */
.login-container {
  max-width: 400px;
  width: 90%;
}

.dense-dropdown .q-item {
  padding-top: 2px;
  padding-bottom: 2px;
  font-size: 13px;
}

/* Make the card slightly translucent so the gradient shows through */
.my-card {
  background-color: rgba(255, 255, 255, 0.9);
}

/* Example logo styling */
.login-logo {
  max-width: 100px;
  border-radius: 4px;
}
</style>
