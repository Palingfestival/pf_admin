<template>
  <q-layout view="hHh lpR fFf">
    <q-header>
      <q-toolbar>
        <q-toolbar-title>V1.1 Medewerkers {{ authStore.naam_vereniging }}</q-toolbar-title>
        <q-btn dense flat icon="logout" @click="logout" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="q-pa-md">
        <!-- Show the form if a medewerker is selected or we're creating a new one -->
        <div v-if="showForm">
          <MedewerkerForm
            ref="medewerkerForm"
            :medewerkerParam="selectedMedewerker"
            @updated="handleMedewerkerUpdated"
          />
        </div>
        <!-- Otherwise, display the dashboard -->
        <div v-else>
          <h1>Registratie medewerkers Palingfestival</h1>

          <p></p>

          <p>
            Links bovenaan kan u met de knop ‘Nieuwe Medewerker’ een nieuwe medewerker toevoegen.
          </p>
          <p>
            Bij het ingeven van gemeente of straat worden automatisch mogelijke waarden voorgesteld.
            Het is enkel mogelijk om een bestaande gemeente/straat in te geven.
          </p>
          <p>
            Indien u al medewerkers ingegeven hebt, kan u deze aanpassen door de medewerker te
            selecteren in de lijst aan de linkerkant.
          </p>
          <p>Voor bepaalde taken dient u een alternatieve keuze op te geven.</p>
          <p>Rechts ziet u een overzicht van het aantal medewerkers dat u reeds heeft.</p>
          <p>Met het kruisje (links) kan u medewerkers verwijderen.</p>
          <p>
            Voor alle vragen, opmerkingen mail naar
            <a href="mailto:medewerkers@palingfestival.be">medewerkers@palingfestival.be</a>
          </p>
          <p>Veel succes.</p>
        </div>
      </q-page>
    </q-page-container>

    <q-drawer
      show-if-above
      v-model="drawerRightOpen"
      side="right"
      width="200"
      class="drawer-border"
    >
      <SidebarRight ref="sidebarRight" />
    </q-drawer>
  </q-layout>
</template>

<script>
import { useAuthStore } from 'stores/auth'
import MedewerkerForm from 'components/medewerkerComponent.vue'
import SidebarRight from 'components/sideBarRight.vue'

export default {
  name: 'MainLayout',
  components: {
    MedewerkerForm,
    SidebarRight,
  },
  computed: {
    authStore() {
      return useAuthStore()
    },
  },

  data() {
    return {
      selectedMedewerker: '',
      showForm: true,
    }
  },
  watch: {
    authStore: {
      handler(newVal) {
        if (newVal) {
          this.selectedMedewerker = newVal.per_identificatie
          if (this.selectedMedewerker === undefined) {
            console.log('Logging Out')
            this.logout()
          }
          if (this.selectedMedewerker === null) {
            console.log('Logging Out')
            this.logout()
          }
        }
      },
      immediate: true,
    },
  },
  methods: {
    logout() {
      const authStore = useAuthStore()
      authStore.clearToken()
      authStore.clearUser()
      this.$router.push('/auth/login')
    },
    async selectMedewerker(id) {
      if (this.showForm && this.$refs.medewerkerForm && this.$refs.medewerkerForm.isDirty) {
        this.$q
          .dialog({
            title: 'Onbewaarde wijzigingen',
            message: 'Er zijn wijzigingen aangebracht, wil je deze bewaren ?',
            persistent: true,
            ok: 'Ja',
            cancel: 'Niet bewaren',
          })
          .onOk(async () => {
            await this.$refs.medewerkerForm.saveMedewerker()
            this.selectedMedewerker = id
          })
          .onCancel(() => {
            this.selectedMedewerker = id
          })
      } else {
        this.selectedMedewerker = id
      }
      this.showForm = true
    },
    async navigateToNewMedewerker() {
      if (this.showForm && this.$refs.medewerkerForm && this.$refs.medewerkerForm.isDirty) {
        this.$q
          .dialog({
            title: 'Onbewaarde wijzigingen',
            message: 'Er zijn wijzigingen aangebracht, wil je deze bewaren ?',
            persistent: true,
            ok: 'Ja',
            cancel: 'Niet bewaren',
          })
          .onOk(async () => {
            await this.$refs.medewerkerForm.saveMedewerker()
            this.selectedMedewerker = ''
          })
          .onCancel(() => {
            this.selectedMedewerker = ''
          })
      } else {
        this.selectedMedewerker = ''
      }
      this.showForm = true
    },
    async goBack() {
      if (this.showForm && this.$refs.medewerkerForm && this.$refs.medewerkerForm.isDirty) {
        this.$q
          .dialog({
            title: 'Unsaved Changes',
            message: 'You have unsaved changes. Do you want to save them before leaving?',
            persistent: true,
            ok: 'Save',
            cancel: 'Don’t Save',
          })
          .onOk(async () => {
            await this.$refs.medewerkerForm.saveMedewerker()
            this.showForm = false
            this.selectedMedewerker = ''
          })
          .onCancel(() => {
            this.showForm = false
            this.selectedMedewerker = ''
          })
      } else {
        this.showForm = false
        this.selectedMedewerker = ''
      }
    },
    printList() {
      window.print()
    },
    handleMedewerkerUpdated() {
      console.log('updated medewerker')
      if (this.$refs.sidebar && this.$refs.sidebar.fetchMedewerkers) {
        this.$refs.sidebar.fetchMedewerkers()
      }
      if (this.$refs.sidebarRight && this.$refs.sidebarRight.fetchdata) {
        this.$refs.sidebarRight.fetchdata()
      }
    },
  },
  beforeRouteLeave(to, from, next) {
    if (this.showForm && this.$refs.medewerkerForm && this.$refs.medewerkerForm.isDirty) {
      this.$q
        .dialog({
          title: 'Onbewaarde wijzigingen',
          message: 'Er zijn wijzigingen aangebracht. Wil je deze bewaren voor je weg navigeert?',
          persistent: true,
          ok: 'Opslaan',
          cancel: 'Niet opslaan',
        })
        .onOk(async () => {
          await this.$refs.medewerkerForm.saveMedewerker()
          next()
        })
        .onCancel(() => {
          // If you want to cancel navigation entirely, call next(false)
          // Otherwise, proceed without saving:
          next()
        })
    } else {
      next()
    }
  },
}
</script>

<style scoped>
.drawer-border {
  border-right: 1px solid #ccc;
}
</style>
