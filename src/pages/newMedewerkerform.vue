<template>
  <div class="parent-form">
    <!-- Dynamically bind the medewerker parameter -->
    <MedewerkerForm :medewerkerParam="medewerkerId" />
  </div>
</template>

<script>
import MedewerkerForm from '../components/medewerkerComponent.vue'

export default {
  name: 'ParentForm',
  components: {
    MedewerkerForm,
  },
  props: {
    // Accept the selected medewerker id from the parent (e.g. MainLayout)
    medewerkerParam: {
      type: String,
      default: '',
    },
  },
}
</script>
