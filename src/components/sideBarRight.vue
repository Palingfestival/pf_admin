<template>
  <div class="medewerker-tree">
    <!-- QTree displays the tree nodes; dense and flat make it compact -->
    <q-tree :nodes="treeNodes" dense flat node-key="id" default-expand-all />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'

export default {
  name: 'MedewerkerTree',
  setup() {
    const treeNodes = ref([])

    // Fetch the data from the API endpoint
    const fetchData = async () => {
      try {
        const response = await api.get(`/adminmedewerkerstree`)
        // Transform the API data into tree nodes
        treeNodes.value = transformData(response.data)
      } catch (error) {
        console.error('Failed to fetch medewerkerstree:', error)
      }
    }

    // Transform the JSON structure into QTree nodes.
    const transformData = (data) => {
      let idCounter = 1
      return data.map((datumGroup) => {
        return {
          id: idCounter++,
          label: `${datumGroup.datum} (${datumGroup.count})`,
          children: datumGroup.tasks.map((taskGroup) => {
            return {
              id: idCounter++,
              label: `${taskGroup.taakomschrijving} (${taskGroup.count})`,
              children: taskGroup.medewerkers.map((medewerker) => {
                return {
                  id: idCounter++,
                  label: `${medewerker.naam} ${medewerker.voornaam}`,
                }
              }),
            }
          }),
        }
      })
    }

    onMounted(() => {
      fetchData()
    })

    // Return fetchData so the parent can call it.
    return {
      treeNodes,
      fetchdata: fetchData,
    }
  },
}
</script>

<style scoped>
.medewerker-tree {
  font-size: 12px; /* smaller font size for density */
  overflow-y: auto;
  /* Adjust width if needed */
  padding: 8px;
}
</style>
