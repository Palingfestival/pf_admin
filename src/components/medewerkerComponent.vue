<template>
  <div>
    <!-- Admin Medewerkers Grid with Search -->
    <div class="q-pa-md">
      <q-input v-model="search" label="Search Naam / Voornaam" outlined dense class="q-mb-md" />
      <q-table
        :rows="filteredMedewerkers"
        :columns="adminColumns"
        row-key="identificatienummer"
        dense
        :row-class="getRowClass"
      >
        <!-- Custom cell for "identificatienummer" -->
        <template v-slot:body-cell-identificatienummer="props">
          <q-td :props="props" :class="getCellClass(props.row)">
            <span
              style="cursor: pointer"
              @click.stop="loadMedewerkerById(props.row.identificatienummer)"
            >
              {{ props.row.identificatienummer }}
            </span>
          </q-td>
        </template>

        <!-- Custom cell for "naam" with tooltip -->
        <template v-slot:body-cell-naam="props">
          <q-td :props="props" :class="getCellClass(props.row)">
            <span class="tooltip-activator">
              {{ props.row.naam }}
            </span>
            <q-tooltip
              anchor="bottom middle"
              self="top middle"
              transition-show="scale"
              transition-hide="scale"
            >
              <div v-if="props.row.taken_json && props.row.taken_json.length">
                <div
                  v-for="(item, index) in props.row.taken_json"
                  :key="index"
                  style="white-space: pre-wrap"
                >
                  {{ item.taak_met_edities ? item.taak_met_edities : item }}
                </div>
              </div>
            </q-tooltip>
          </q-td>
        </template>
        <!-- Custom cell for "voornaam" with conditional styling -->
        <template v-slot:body-cell-voornaam="props">
          <q-td :props="props" :class="getCellClass(props.row)">
            {{ props.row.voornaam }}
          </q-td>
        </template>
        <template v-slot:body-cell-straat="props">
          <q-td :props="props" :class="getCellClass(props.row)">
            {{ props.row.straat }}
          </q-td>
        </template>
        <template v-slot:body-cell-gemeente="props">
          <q-td :props="props" :class="getCellClass(props.row)">
            {{ props.row.gemeente }}
          </q-td>
        </template>
        <template v-slot:body-cell-telefoon="props">
          <q-td :props="props" :class="getCellClass(props.row)">
            {{ props.row.telefoon }}
          </q-td>
        </template>

        <template v-slot:body-cell-gsm="props">
          <q-td :props="props" :class="getCellClass(props.row)">
            {{ props.row.gsm }}
          </q-td>
        </template>
        <template v-slot:body-cell-vereniging="props">
          <q-td :props="props" :class="getCellClass(props.row)">
            {{ props.row.vereniging }}
          </q-td>
        </template>
        <!-- Custom cell for "geboortedatum" using the helper method -->
        <template v-slot:body-cell-geboortedatum="props">
          <q-td :props="props" :class="getCellClass(props.row)">
            {{ formatDateSimple(props.row.geboortedatum) }}
          </q-td>
        </template>

        <!-- Custom cell for "registratiedatum" using the helper method -->
        <template v-slot:body-cell-registratiedatum="props">
          <q-td :props="props" :class="getCellClass(props.row)">
            {{ formatDateSimple(props.row.registratiedatum) }}
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Medewerker form and selected tasks container arranged in a flex row -->
    <div class="medewerker-form-container q-pa-md">
      <!-- Left: Form column -->
      <div class="form-column">
        <q-form @submit="saveMedewerker">
          <div class="q-gutter-sm">
            <div class="row">
              <div class="col">
                <!-- Vereniging -->
                <q-select
                  v-model="medewerker.vereniging"
                  label="Vereniging"
                  filled
                  emit-value
                  map-options
                  popup-content-class="dense-dropdown"
                  :options="verenigingen"
                  option-value="kode"
                  option-label="naam"
                  :rules="[(val) => !!val || 'Selecteer een vereniging']"
                />
              </div>
            </div>
            <!-- Naam and Voornaam -->
            <div class="row">
              <div class="col">
                <q-input v-model="medewerker.naam" label="Naam" outlined dense />
              </div>
              <div class="col">
                <q-input v-model="medewerker.voornaam" label="Voornaam" outlined dense />
              </div>
            </div>
            <!-- Gemeente -->
            <div class="row">
              <div class="col">
                <q-select
                  filled
                  v-model="medewerker.gemeente"
                  label="Gemeente"
                  use-input
                  hide-selected
                  fill-input
                  input-debounce="0"
                  :options="gemeenteOptions"
                  @filter="filterGemeente"
                  outlined
                  dense
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey">No results</q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>
            <!-- Straat and Nummer -->
            <div class="row">
              <div class="col">
                <q-select
                  filled
                  v-model="medewerker.straat"
                  label="Straat"
                  use-input
                  hide-selected
                  fill-input
                  input-debounce="0"
                  :options="straatOptions"
                  @filter="filterStraat"
                  outlined
                  dense
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey">No results</q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <div class="col-auto">
                <q-input v-model="medewerker.nr" label="Nummer" outlined dense />
              </div>
            </div>
            <!-- Telefoon and GSM  -->
            <div class="row">
              <q-input
                v-model="medewerker.telefoon"
                label="Telefoon"
                outlined
                dense
                :rules="[telefoonRule]"
              />
              <div class="col">
                <q-input
                  v-model="medewerker.gsm"
                  label="GSM"
                  outlined
                  dense
                  :rules="[
                    (val) =>
                      !val ||
                      /^04\d{8}$/.test(val) ||
                      'Ongeldig mobiel nummer! Gebruik het formaat 04XXXXXXXX.',
                  ]"
                />
              </div>
            </div>
            <!-- Geboortedatum and Email -->
            <div class="row">
              <div class="col">
                <q-input
                  v-model="medewerker.geboortedatum"
                  type="date"
                  label="Geboortedatum"
                  outlined
                  dense
                />
              </div>
              <div class="col">
                <q-input
                  v-model="medewerker.email"
                  type="email"
                  label="Email"
                  outlined
                  dense
                  :rules="[
                    (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Invalid email address',
                  ]"
                />
              </div>
            </div>
            <!-- Opmerking -->
            <div class="row">
              <div class="col">
                <q-input v-model="medewerker.opmerking" label="Opmerking" outlined dense />
              </div>
            </div>
            <!-- Save Button -->
            <div class="row">
              <div class="col">
                <q-btn label="Bewaar gegevens" type="submit" color="primary" />
              </div>
            </div>
          </div>
        </q-form>
      </div>
      <!-- Right: Selected Tasks Container -->
      <div class="tasks-column">
        <div class="selected-tasks-container">
          <q-table
            :rows="formattedTasks"
            :columns="columns"
            v-model:pagination="pagination"
            flat
            bordered
            dense
            hide-pagination
          />
        </div>
      </div>
    </div>

    <!-- The VolunteerTaskForm can be placed below or in another desired location -->
    <VolunteerTaskForm
      :tasks="tasksData"
      :key="tasksData.length"
      @update:selected-tasks="updateSelectedTasks"
    />
  </div>
</template>

<script>
import { api } from 'boot/axios'
import VolunteerTaskForm from './takenComponent.vue'
import { useAuthStore } from 'stores/auth'
import { Notify } from 'quasar'
import isEqual from 'lodash/isEqual'

export default {
  name: 'MedewerkerComponent',
  props: {
    medewerkerParam: {
      type: String,
      default: '',
    },
  },

  components: {
    VolunteerTaskForm,
  },

  data() {
    return {
      search: '',
      adminMedewerkers: [],
      adminColumns: [
        { name: 'identificatienummer', label: 'ID', field: 'identificatienummer', align: 'left' },
        { name: 'naam', label: 'Naam', field: 'naam', align: 'left' },
        { name: 'voornaam', label: 'Voornaam', field: 'voornaam', align: 'left' },
        { name: 'straat', label: 'Straat', field: 'straat', align: 'left' },
        { name: 'gemeente', label: 'Gemeente', field: 'gemeente', align: 'left' },
        { name: 'telefoon', label: 'Telefoon', field: 'telefoon', align: 'left' },
        { name: 'gsm', label: 'GSM', field: 'gsm', align: 'left' },
        { name: 'geboortedatum', label: 'Geboortedatum', field: 'geboortedatum', align: 'left' },
        { name: 'vereniging', label: 'Vereniging', field: 'vereniging', align: 'left' },
        {
          name: 'registratiedatum',
          label: 'Registratiedatum',
          field: 'registratiedatum',
          align: 'left',
        },
      ],
      medewerker: {
        identificatienummer: '',
        naam: '',
        voornaam: '',
        gemeente: '',
        straat: '',
        nr: '',
        telefoon: '',
        gsm: '',
        geboortedatum: '',
        email: '',
        opmerking: '',
        vereniging: null,
        selectedTasks: [],
      },
      originalMedewerker: null,
      pagination: { page: 1, rowsPerPage: 0 },
      columns: [
        { name: 'date', required: true, label: 'Dag', align: 'left', field: 'date' },
        {
          name: 'eerstekeus',
          required: true,
          label: 'Gewenste taak',
          align: 'left',
          field: 'eerstekeus',
        },
        { name: 'tweedekeus', label: 'Alternatieve taak', align: 'left', field: 'tweedekeus' },
      ],
      loading: false,
      verenigingen: [],
      tasksData: [],
      gemeenteOptions: [],
      Options: [],
      needle: '',
      straatOptions: [],
      results: [],
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
    }
  },

  computed: {
    filteredMedewerkers() {
      if (!this.search) return this.adminMedewerkers
      const searchLower = this.search.toLowerCase()
      return this.adminMedewerkers.filter(
        (m) =>
          (m.naam && m.naam.toLowerCase().includes(searchLower)) ||
          (m.voornaam && m.voornaam.toLowerCase().includes(searchLower)),
      )
    },
    formattedTasks() {
      return this.medewerker.selectedTasks
        .slice()
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((task) => ({
          date: this.formatDate(task.date),
          eerstekeus: task.eerstekeus,
          tweedekeus: task.tweedekeus || '',
        }))
    },
    isDirty() {
      return this.originalMedewerker !== null && !isEqual(this.medewerker, this.originalMedewerker)
    },
  },

  mounted() {
    this.fetchVerenigingen()
    this.fetchAdminMedewerkers()
  },

  methods: {
    getCellClass(row) {
      const classes = []
      // If softdelete is 'Y', add a strikethrough class
      if (
        String(row.softdelete || '')
          .trim()
          .toUpperCase() === 'Y'
      ) {
        classes.push('line-through')
      }
      // If aantal_taken > 0, add a light-green background class
      if (Number(row.aantal_taken) > 0) {
        classes.push('bg-light-green')
      }
      return classes.join(' ')
    },
    getTooltipContent(row) {
      if (row.taken_json && row.taken_json.length)
        return row.taken_json
          .map((item) => (item.taak_met_edities ? item.taak_met_edities : item))
          .join('\n')
      return ''
    },
    fetchAdminMedewerkers() {
      api
        .get('/adminmedewerkers')
        .then((response) => {
          this.adminMedewerkers = response.data
        })
        .catch((error) => {
          Notify.create({
            type: 'negative',
            message: 'Fout bij ophalen admin medewerkers: ' + error,
          })
        })
    },
    formatDateSimple(dateStr) {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      const day = ('0' + d.getDate()).slice(-2)
      const month = ('0' + (d.getMonth() + 1)).slice(-2)
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    },
    handleRowClick(row) {
      this.loadMedewerkerById(row.id)
    },
    async loadMedewerkerById(id) {
      const response = await api.get(`/medewerker?medewerker=${id}`)
      if (response.data && response.data[0]) {
        const data = response.data[0]
        // Ensure selectedTasks is at least an empty array:
        this.medewerker = {
          ...data,
          selectedTasks: data.selectedTasks || [],
        }
        this.originalMedewerker = JSON.parse(JSON.stringify(this.medewerker))
      }

      const response2 = await api.get(`/admintaakperiodes?medewerker=${id}`)
      this.tasksData = response2.data
    },
    getRowClass(row) {
      console.log('Row in getRowClass:', row)
      return 'bg-light-green'
    },
    fetchVerenigingen() {
      api
        .get('/verenigingen')
        .then((response) => {
          this.verenigingen = response.data
        })
        .catch((error) => {
          Notify.create({ type: 'negative', message: 'Fout bij ophalen verenigingen: ' + error })
        })
    },
    formatDate(dateStr) {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      const dayNames = [
        'zondag',
        'maandag',
        'dinsdag',
        'woensdag',
        'donderdag',
        'vrijdag',
        'zaterdag',
      ]
      const dayName = dayNames[d.getDay()]
      const day = ('0' + d.getDate()).slice(-2)
      const month = ('0' + (d.getMonth() + 1)).slice(-2)
      return `${dayName} ${day}/${month}`
    },
    async loadTasks() {
      const response2 = await api.get(`/taakperiodes?web=Y`)
      this.tasksData = response2.data
    },
    async loadMedewerker() {
      this.loading = true
      try {
        if (this.medewerkerParam !== '') {
          const response = await api.get(`/medewerker?medewerker=${this.medewerkerParam}`)
          if (response.data) {
            this.medewerker = response.data[0]
            console.log(this.medewerker.vereniging)
            this.originalMedewerker = JSON.parse(JSON.stringify(this.medewerker))
          }
          const response2 = await api.get(`/taakperiodes?web=Y&medewerker=${this.medewerkerParam}`)
          this.tasksData = response2.data
        } else {
          const response2 = await api.get(`/taakperiodes?web=Y`)
          this.tasksData = response2.data
          this.originalMedewerker = JSON.parse(JSON.stringify(this.medewerker))
        }
      } catch (error) {
        console.error('Failed to fetch medewerker data:', error)
        Notify.create({ type: 'negative', message: 'Failed to load medewerker data.' })
      } finally {
        this.loading = false
      }
    },
    telefoonRule(val) {
      if (!val) return true
      const telefoon = val.replace(/\s|\/|-/g, '')
      const areaCode = this.areaCodes.find((code) => telefoon.startsWith(code))
      if (!areaCode) return 'Ongeldig vast telefoonnummer! Gebruik formaat zonenummer/XXX XX XX.'
      const localNumber = telefoon.slice(areaCode.length)
      if (areaCode.length === 2 && localNumber.length !== 7) return 'Ongeldige lengte !'
      if (areaCode.length === 3 && localNumber.length !== 6) return 'Ongeldige lengte !'
      return true
    },
    clearForm() {
      this.medewerker = {
        naam: '',
        voornaam: '',
        gemeente: '',
        straat: '',
        nr: '',
        telefoon: '',
        gsm: '',
        geboortedatum: '',
        email: '',
        identificatienummer: '',
        vereniging: '',
        opmerking: '',
        selectedTasks: [],
      }
      this.originalMedewerker = JSON.parse(JSON.stringify(this.medewerker))
    },
    async fetchTasks() {
      const response = await api.get('/taakperiodes?web=Y')
      this.tasksData = response.data
    },
    updateSelectedTasks(selectedTasks) {
      this.medewerker.selectedTasks = selectedTasks
      if (this.originalMedewerker && !('selectedTasks' in this.originalMedewerker)) {
        this.originalMedewerker = JSON.parse(JSON.stringify(this.medewerker))
      }
    },
    validateTelefoon() {
      const telefoon = this.medewerker.telefoon.replace(/\s|\/|-/g, '')
      const areaCode = this.areaCodes.find((code) => telefoon.startsWith(code))
      if (!areaCode) {
        Notify.create({
          type: 'negative',
          message: 'Foutief vast telefoonnummer! Gebruik formaat zonenummer/XXX XX XX.',
        })
        this.medewerker.telefoon = ''
        return
      }
      const localNumber = telefoon.slice(areaCode.length)
      if (areaCode.length === 2 && localNumber.length !== 7) {
        Notify.create({ type: 'negative', message: 'Foutief nummer!' })
        this.medewerker.telefoon = ''
        return
      }
      if (areaCode.length === 3 && localNumber.length !== 6) {
        Notify.create({ type: 'negative', message: 'Foutief nummer!' })
        this.medewerker.telefoon = ''
        return
      }
      this.medewerker.telefoon = `${areaCode}/${localNumber.slice(0, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5)}`
    },
    validateGSM() {
      const gsmRegex = /^04\d{8}$/
      const gsm = this.medewerker.gsm.replace(/\s|\/|-/g, '')
      if (!gsmRegex.test(gsm)) {
        Notify.create({
          type: 'negative',
          message: 'Foutief mobiel nummer! Gebruik formaat 04XXXXXXXX.',
        })
        this.medewerker.gsm = ''
        return
      }
      this.medewerker.gsm = `${gsm.slice(0, 4)}/${gsm.slice(4, 6)} ${gsm.slice(6, 8)} ${gsm.slice(8)}`
    },
    async filterGemeente(val, update) {
      if (val.length < 2) {
        update()
        return
      }
      const results = await api.get(`/gemeente-search?zoek=${val.toUpperCase()}`)
      this.gemeenteOptions = results.data.map((item) => ({
        label: item.gemeente,
        value: item.gemeente,
      }))
      update()
    },
    async filterStraat(val, update) {
      if (val.length < 2) {
        update()
        return
      }
      const gemeenteValue =
        this.medewerker.gemeente && typeof this.medewerker.gemeente === 'object'
          ? this.medewerker.gemeente.value
          : this.medewerker.gemeente
      console.log(gemeenteValue)
      const response = await api.get(
        `/straat-search?gemeente=${gemeenteValue}&zoek=${val.toUpperCase()}`,
      )
      this.straatOptions = response.data.map((item) => ({ label: item.straat, value: item.straat }))
      update()
    },
    validateEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(this.medewerker.email)) {
        Notify.create({ type: 'negative', message: 'Invalid email address!' })
      }
    },
    async saveMedewerker() {
      if (typeof this.medewerker.gemeente === 'object' && this.medewerker.gemeente.value) {
        this.medewerker.gemeente = this.medewerker.gemeente.value
      }
      if (typeof this.medewerker.straat === 'object' && this.medewerker.straat.value) {
        this.medewerker.straat = this.medewerker.straat.value
      }
      if (
        !this.medewerker.naam ||
        !this.medewerker.voornaam ||
        !this.medewerker.gemeente ||
        !this.medewerker.straat ||
        !this.medewerker.nr ||
        !this.medewerker.geboortedatum ||
        !this.medewerker.email
      ) {
        Notify.create({
          type: 'negative',
          message:
            'Vul alstublieft alle verplichte velden in: Naam, Voornaam, Gemeente, Straat, Nummer, Geboortedatum, Email.',
        })
        return
      }
      const authStore = useAuthStore()
      this.vereniging = authStore.vereniging
      await api.post('/savemedewerker', this.medewerker)
      Notify.create({ type: 'positive', message: 'Saved successfully!' })
      this.originalMedewerker = JSON.parse(JSON.stringify(this.medewerker))
      this.$emit('updated')
    },
  },
}
</script>

<style scoped>
/* Row styling for table */
.line-through {
  text-decoration: line-through;
}
.bg-light-green {
  background-color: lightgreen;
}

/* Denser styling for the table */
.dense-table .q-tr,
.dense-table .q-td {
  padding: 4px 8px !important;
  font-size: 12px;
}

/* Layout for the form and tasks columns */
.medewerker-form-container {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.form-column {
  flex: 0.6; /* takes available space */
}

.tasks-column {
  flex: 0 0 300px; /* fixed width for selected tasks grid */
  /* Optionally add styling for border or background */
  border: 1px solid #ccc;
  padding: 8px;
  background-color: #f9f9f9;
}

.selected-tasks-container {
  /* You can adjust this styling as needed */
  margin-top: 16px;
}
</style>
