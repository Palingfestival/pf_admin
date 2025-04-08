<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h5">Welcome to the Medewerkers Dashboard V2</div>
        <div class="handleiding">
          <p>Welkom bij het programma voor registratie medewerkers Palingfestival {{ editie }}</p>

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
          <p>
            Vergeet ook niet het aanspreekpunt voor de 3 dagen in te geven (rechts op het scherm).
          </p>
          <p>
            Voor alle vragen, opmerkingen mail naar
            <a href="mailto:medewerkers@palingfestival.be">medewerkers@palingfestival.be</a>
          </p>
          <p>Veel succes.</p>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-btn label="Refresh List" color="primary" @click="fetchMedewerkers" />
      </q-card-section>

      <q-list>
        <q-item
          v-for="medewerker in medewerkers"
          :key="medewerker.identificatienummer"
          clickable
          @click="selectMedewerker(medewerker)"
        >
          <q-item-section>
            <div>{{ medewerker.voornaam }} {{ medewerker.naam }}</div>
            <div class="text-caption text-grey">{{ medewerker.gemeente }}</div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <q-dialog v-model="showMedewerkerDetails">
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ selectedMedewerker.voornaam }} {{ selectedMedewerker.naam }}</div>
        </q-card-section>

        <q-card-section>
          <div><strong>Gemeente:</strong> {{ selectedMedewerker.gemeente }}</div>
          <div>
            <strong>Straat:</strong> {{ selectedMedewerker.straat }} {{ selectedMedewerker.nr }}
          </div>
          <div><strong>Email:</strong> {{ selectedMedewerker.email }}</div>
          <div><strong>Telefoon:</strong> {{ selectedMedewerker.telefoon }}</div>
          <div><strong>GSM:</strong> {{ selectedMedewerker.gsm }}</div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" @click="showMedewerkerDetails = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
export default {
  data() {
    return {
      medewerkers: [],
      selectedMedewerker: null,
      showMedewerkerDetails: false,
    }
  },
  mounted() {
    this.fetchMedewerkers()
  },
  methods: {
    async fetchMedewerkers() {
      try {
        const response = await this.$axios.get('/api/medewerkers')
        this.medewerkers = response.data
      } catch (error) {
        this.$q.notify({ type: 'negative', message: 'Failed to fetch medewerkers ' + error })
      }
    },
    selectMedewerker(medewerker) {
      this.selectedMedewerker = medewerker
      this.showMedewerkerDetails = true
    },
  },
}
</script>
