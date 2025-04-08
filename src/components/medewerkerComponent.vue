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
        @row-click="handleRowClick"
      >
        <template v-slot:body-cell-tasks="props">
          <q-tooltip
            anchor="top middle"
            self="bottom middle"
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
          <q-icon name="info" class="cursor-pointer" />
        </template>

        <!-- Default body slot renders other cells as usual -->
        <template v-slot:body="props">
          <q-tr :props="props" :class="getRowClass(props.row)">
            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              {{ props.row[col.field] }}
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
    <div class="form-container">
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

          <!-- Geboortedatum -->
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

          <!-- Selected Tasks Summary in a Grid -->
          <div v-if="medewerker.selectedTasks && medewerker.selectedTasks.length">
            <div class="selected-tasks-container" style="padding-top: 10px">
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
          <!-- Save Button -->
          <div class="row">
            <div class="col">
              <q-btn label="Bewaar gegevens" type="submit" color="primary" />
            </div>
          </div>
        </div>
        <VolunteerTaskForm
          :tasks="tasksData"
          :key="tasksData.length"
          @update:selected-tasks="updateSelectedTasks"
        />
      </q-form>
    </div>
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
      // Define only the fields you want to display in the grid
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
        { name: 'tasks', label: '', field: 'tasks', align: 'center' },
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
      // Store a baseline version to detect changes
      originalMedewerker: null,
      pagination: {
        page: 1,
        rowsPerPage: 0, // we'll override this in a moment
      },
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
      vereniging: '',
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
      if (!this.search) {
        return this.adminMedewerkers
      }
      const searchLower = this.search.toLowerCase()
      return this.adminMedewerkers.filter(
        (m) =>
          (m.naam && m.naam.toLowerCase().includes(searchLower)) ||
          (m.voornaam && m.voornaam.toLowerCase().includes(searchLower)),
      )
    },
    formattedTasks() {
      return this.medewerker.selectedTasks
        .slice() // clone the array so we don't modify the original
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((task) => ({
          date: this.formatDate(task.date),
          eerstekeus: task.eerstekeus,
          tweedekeus: task.tweedekeus || '',
        }))
    },
    // Compare current state with the original state to detect unsaved changes
    isDirty() {
      return this.originalMedewerker !== null && !isEqual(this.medewerker, this.originalMedewerker)
    },
  },

  watch: {
    medewerkerParam(newVal, oldVal) {
      if (newVal !== oldVal) {
        if (newVal) {
          this.loadMedewerker()
          this.loading = false
        } else {
          this.clearForm()
          this.loadTasks()
          this.loading = false
        }
      }
    },
  },

  mounted() {
    this.fetchVerenigingen()
    this.fetchAdminMedewerkers()
  },

  methods: {
    getTooltipContent(row) {
      if (row.taken_json && row.taken_json.length) {
        return row.taken_json
          .map((item) => (item.taak_met_edities ? item.taak_met_edities : item))
          .join('\n')
      }
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
    // Called when a row is clicked; load the medewerker by its identificatienummer
    handleRowClick(row) {
      this.loadMedewerkerById(row.identificatienummer)
    },
    loadMedewerkerById(id) {
      api
        .get(`/medewerker?medewerker=${id}`)
        .then((response) => {
          // Handle the loaded medewerker, e.g. populate the form fields
          console.log('Loaded medewerker:', response.data[0])
          // You can assign the data to your form model if needed
        })
        .catch((error) => {
          Notify.create({ type: 'negative', message: 'Failed to load medewerker data: ' + error })
        })
    },
    // Returns a string of CSS classes based on row values
    getRowClass(row) {
      let classes = []
      if (row.softdelete === 'Y') {
        classes.push('line-through')
      }
      if (row.aantal_taken > 0) {
        classes.push('bg-light-green')
      }
      return classes.join(' ')
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
    // Formats a date string "YYYY-MM-DD" to "DD/MM/YYYY"
    formatDate(dateStr) {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      // Dutch day names
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
      // Format the date as DD/MM/YYYY
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
        if (this.medewerkerParam != '') {
          const response = await api.get(`/medewerker?medewerker=${this.medewerkerParam}`)
          if (response.data) {
            this.medewerker = response.data[0]
            console.log(this.medewerker.vereniging)
            // Store the loaded state as the baseline
            this.originalMedewerker = JSON.parse(JSON.stringify(this.medewerker))
          }
          const response2 = await api.get(`/taakperiodes?web=Y&medewerker=${this.medewerkerParam}`)
          this.tasksData = response2.data
        } else {
          const response2 = await api.get(`/taakperiodes?web=Y`)
          this.tasksData = response2.data
          // For new records, set the baseline after clearing the form
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
      // Allow blank value
      if (!val) return true

      const telefoon = val.replace(/\s|\/|-/g, '')
      const areaCode = this.areaCodes.find((code) => telefoon.startsWith(code))
      if (!areaCode) return 'Ongeldig vast telefoonnummer! Gebruik formaat zonenummer/XXX XX XX.'

      const localNumber = telefoon.slice(areaCode.length)
      if (areaCode.length === 2 && localNumber.length !== 7) {
        return 'Ongeldige lengte !'
      }
      if (areaCode.length === 3 && localNumber.length !== 6) {
        return 'Ongeldige lengte !'
      }
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
      // Set the baseline for a new record
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

      if (areaCode.length === 2) {
        if (localNumber.length !== 7) {
          Notify.create({
            type: 'negative',
            message: 'Foutief nummer!',
          })
          this.medewerker.telefoon = ''
          return
        }
        this.medewerker.telefoon = `${areaCode}/${localNumber.slice(0, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5)}`
      } else if (areaCode.length === 3) {
        if (localNumber.length !== 6) {
          Notify.create({
            type: 'negative',
            message: 'Foutief nummer!',
          })
          this.medewerker.telefoon = ''
          return
        }
        this.medewerker.telefoon = `${areaCode}/${localNumber.slice(0, 2)} ${localNumber.slice(2, 4)} ${localNumber.slice(4)}`
      }
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
      // Ensure gemeente and straat are correctly formatted as strings
      if (typeof this.medewerker.gemeente === 'object' && this.medewerker.gemeente.value) {
        this.medewerker.gemeente = this.medewerker.gemeente.value
      }
      if (typeof this.medewerker.straat === 'object' && this.medewerker.straat.value) {
        this.medewerker.straat = this.medewerker.straat.value
      }

      // Check required fields: naam, voornaam, gemeente, straat, nummer, geboortedatum, email
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
      //this.medewerker.vereniging = this.vereniging
      await api.post('/savemedewerker', this.medewerker)
      Notify.create({ type: 'positive', message: 'Saved successfully!' })
      // Reset the baseline after saving
      this.originalMedewerker = JSON.parse(JSON.stringify(this.medewerker))
      this.$emit('updated')
    },
  },
}
</script>

<style scoped>
/* Apply strikethrough style for rows with SoftDelete = 'Y' */
.line-through {
  text-decoration: line-through;
}
/* Lightgreen background for rows with AantalTaken > 0 */
.bg-light-green {
  background-color: lightgreen;
}
.form-container {
  max-width: 900px;
  margin: 0 auto;
}
</style>
