<template>
  <div class="sidebar-container">
    <div class="sidebar-buttons q-pa-sm">
      <q-btn label="Nieuwe medewerker" @click="createNew" color="primary" class="full-width" />
      <!-- When "Print Lijst" is clicked, the printList method generates the PDF -->
      <q-btn label="Print Lijst" @click="printList" color="primary" class="full-width q-mt-sm" />
    </div>
    <q-separator />
    <div class="medewerkers-container">
      <q-list dense>
        <q-item
          v-for="medewerker in medewerkers"
          :key="medewerker.identificatienummer"
          clickable
          @click="selectMedewerker(medewerker.identificatienummer)"
          class="q-pa-none medewerker-item"
          :class="{ 'bg-lightblue': selectedMedewerker === medewerker.identificatienummer }"
        >
          <!-- Display name in lightgreen if hastasks is 'Yes' -->
          <q-item-section
            class="q-pa-xs"
            :class="{ 'text-lightgreen': medewerker.hastasks === 'Yes' }"
          >
            {{ medewerker.naam }} {{ medewerker.voornaam }}
          </q-item-section>
          <!-- Delete icon with click event -->
          <q-item-section side class="q-pa-xs">
            <q-btn
              round
              dense
              color="red"
              icon="close"
              @click.stop="confirmDelete(medewerker)"
              size="xs"
              style="min-width: 16px; width: 16px; height: 16px; padding: 0"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<script>
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth'
import { useRouter } from 'vue-router'

// Import pdfmake and fonts
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

// Try using the default export if needed:
if (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs
} else if (pdfFonts.default && pdfFonts.default.pdfMake && pdfFonts.default.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.default.pdfMake.vfs
} else {
  console.error('Unable to set pdfMake.vfs')
}

export default {
  name: 'SideBar',
  props: {
    selectedMedewerker: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      medewerkers: [],
    }
  },
  mounted() {
    this.fetchMedewerkers()
  },
  methods: {
    async fetchMedewerkers() {
      const authStore = useAuthStore()
      const router = useRouter()

      // Redirect to login page if vereniging is not defined
      if (!authStore.vereniging) {
        router.push('/auth/login')
        return
      }
      try {
        const response = await api.get(`/medewerkers?vereniging=${authStore.vereniging}`)
        this.medewerkers = response.data
        console.log(this.medewerkers)
      } catch (error) {
        console.error('Failed to fetch medewerkers:', error)
      }
    },
    createNew() {
      this.$emit('create-new')
    },
    // Generate PDF from API data using pdfmake.
    async printList() {
      try {
        const authStore = useAuthStore()
        const response = await api.get(`/medewerkerslijst?vereniging=${authStore.vereniging}`)
        const data = response.data

        // Build a single table body.
        const tableBody = []
        // Add header row (this row will be repeated on each page).
        tableBody.push([
          { text: 'Naam', style: 'tableHeader' },
          { text: 'Voornaam', style: 'tableHeader' },
          { text: 'Eerste Keuze', style: 'tableHeader' },
          { text: 'Van Uur', style: 'tableHeader' },
          { text: 'Tot Uur', style: 'tableHeader' },
          { text: 'Tweede Keuze', style: 'tableHeader' },
        ])

        // Loop through each date group.
        data.forEach((group) => {
          // Add a date group header row that spans all columns.
          tableBody.push([
            {
              text: group.datum,
              colSpan: 6,
              bold: true,
              margin: [0, 5, 0, 5],
            },
            {},
            {},
            {},
            {},
            {},
          ])

          // Then add a row for each medewerker in that group.
          group.medewerkers.forEach((m) => {
            tableBody.push([
              { text: m.naam, margin: [10, 0, 0, 0] }, // Indented naam cell
              m.voornaam,
              m.eerste_keuze,
              m.van_uur,
              m.tot_uur,
              m.tweede_keuze || '',
            ])
          })
        })

        const docDefinition = {
          pageSize: 'A4',
          pageOrientation: 'landscape',
          content: [
            {
              style: 'tableExample',
              table: {
                headerRows: 1, // Repeat the first row on every page
                widths: ['*', '*', '*', 50, 50, '*'], // Set fixed widths for van_uur and tot_uur
                body: tableBody,
              },
              layout: {
                /* eslint-disable no-unused-vars */
                hLineWidth: function (i, node) {
                  return 0
                },
                vLineWidth: function (i, node) {
                  return 0
                },
                /* eslint-enable no-unused-vars */
              },
              margin: [0, 0, 0, 10],
            },
          ],
          styles: {
            tableExample: {
              margin: [0, 5, 0, 15],
            },
            tableHeader: {
              bold: true,
              fontSize: 13,
              color: 'black',
            },
          },
        }
        // Open the PDF in a new window/tab.
        pdfMake.createPdf(docDefinition).getBlob((blob) => {
          const fileName = 'Medewerkerslijst.pdf'
          const url = URL.createObjectURL(blob)

          // Trigger download with the specified file name.
          const a = document.createElement('a')
          a.href = url
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)

          // Open the PDF in a new window/tab.
          window.open(url, '_blank')
        })
      } catch (error) {
        console.error('Failed to generate PDF', error)
        this.$q.notify({
          type: 'negative',
          message: 'Failed to generate PDF',
        })
      }
    },
    selectMedewerker(id) {
      this.$emit('select-medewerker', id)
    },
    confirmDelete(medewerker) {
      this.$q
        .dialog({
          title: 'Wissen medewerker',
          message: `Ben je zeker dat je <b>${medewerker.naam} ${medewerker.voornaam}</b> uit de lijst wil verwijderen?`,
          html: true,
          cancel: { label: 'Nee' },
          ok: { label: 'Ja' },
          persistent: true,
        })
        .onOk(() => {
          this.deleteMedewerker(medewerker.identificatienummer)
        })
        .onCancel(() => {
          // User cancelled the deletion.
        })
    },
    async deleteMedewerker(identificatienummer) {
      try {
        await api.delete(`/medewerker?identificatienummer=${identificatienummer}`)
        this.medewerkers = this.medewerkers.filter(
          (m) => m.identificatienummer !== identificatienummer,
        )
        this.$q.notify({
          type: 'positive',
          message: 'Medewerker is gewist.',
        })
        this.fetchMedewerkers()
      } catch (error) {
        console.error('Failed to delete medewerker:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Wissen van medewerker is mislukt.',
        })
      }
    },
  },
}
</script>

<style scoped>
.bg-lightblue {
  background-color: lightblue !important;
}

.text-lightgreen {
  color: red !important;
  font-weight: bolder;
}

.medewerker-item {
  min-height: 20px !important;
}

.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-buttons {
  flex: 0 0 auto;
}

.medewerkers-container {
  flex: 1 1 auto;
  overflow-y: auto;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
