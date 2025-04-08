<template>
  <div style="padding-top: 10px">
    <q-card class="q-pa-md">
      <q-list bordered separator v-if="Object.keys(groupedTasks).length > 0">
        <template v-for="(tasksByDate, category) in groupedTasks" :key="category">
          <!-- Collapsible Section -->
          <q-expansion-item
            v-model="expandedCategories[category]"
            expand-separator
            dense
            class="q-mb-md compact-table"
          >
            <template v-slot:header>
              <q-item-section>
                <q-item-label class="text-primary text-bold text-h6">{{ category }}</q-item-label>
              </q-item-section>
            </template>

            <!-- Table Wrapper -->
            <div class="dense-table">
              <q-table
                flat
                dense
                bordered
                class="q-mb-md compact-table"
                :rows="formatRows(tasksByDate, category)"
                :columns="getCategoryColumns(category)"
                row-key="task"
                :rows-per-page-options="[0]"
                hide-bottom
              >
                <template v-slot:header="props">
                  <q-tr class="dense-header" :props="props">
                    <q-th
                      v-for="(col, index) in props.cols"
                      :key="col.name"
                      :style="{
                        backgroundColor:
                          col.name === 'task' ? '#ffffff' : index % 2 === 1 ? '#e3f2fd' : '#ffffff',
                      }"
                      :props="props"
                    >
                      <div class="text-center">
                        <div v-if="col.name !== 'task'" class="text-bold medium-text">
                          {{ getWeekday(col.name) }}
                        </div>
                        <div v-if="col.name !== 'task'" class="text-caption medium-text">
                          {{ formatDate(col.name) }}
                        </div>
                        <!-- Swap Button for this date only if conditions are met -->
                        <div v-if="col.name !== 'task'" class="q-pa-sm">
                          <q-btn
                            v-if="admin === 'Y' && canSwap(category, col.name)"
                            flat
                            color="primary"
                            size="sm"
                            :label="`Swap`"
                            @click="swapSelections(category, col.name)"
                          />
                        </div>
                        <div v-if="col.name === 'task'" class="medium-text">Task</div>
                      </div>
                    </q-th>
                  </q-tr>
                </template>

                <template v-slot:body="props">
                  <q-tr class="dense-row" :props="props">
                    <q-td key="task">
                      <b class="medium-text">{{ props.row.task }}</b>
                    </q-td>

                    <template v-for="(date, index) in getCategoryDates(category)" :key="date">
                      <q-td
                        :style="{ backgroundColor: index % 2 === 1 ? '#ffffff' : '#e3f2fd' }"
                        class="dense-cell"
                      >
                        <!-- Show checkboxes only if the task is available on this date -->
                        <template v-if="props.row[date]">
                          <q-checkbox
                            dense
                            size="sm"
                            v-if="
                              props.row[date].eerstekeus === 'Y' ||
                              !isEersteKeusSelectedForDate(category, date)
                            "
                            v-model="props.row[date].eerstekeus"
                            true-value="Y"
                            false-value="N"
                            class="dense-checkbox"
                            label=""
                            @update:model-value="
                              updateSelection(category, props.row.task, date, 'eerstekeus', $event)
                            "
                          />

                          <!-- Tweedekeus (Alternative) Checkbox:
               Shown for every task on this day with alternatief === 'Y'
               if any task has been chosen as eerstekeus,
               except for the task that already has eerstekeus === 'Y' -->
                          <q-checkbox
                            v-if="
                              isEersteKeusSelectedForDate(category, date) &&
                              getSelectedTaskAlternatief(category, date) === 'Y' &&
                              props.row[date].eerstekeus !== 'Y' &&
                              (!isTweedeKeusSelectedForDate(category, date) ||
                                props.row[date].tweedekeus === 'Y')
                            "
                            dense
                            size="sm"
                            v-model="props.row[date].tweedekeus"
                            true-value="Y"
                            false-value="N"
                            class="dense-checkbox"
                            label="Alternatief"
                            @update:model-value="
                              updateSelection(category, props.row.task, date, 'tweedekeus', $event)
                            "
                          />
                        </template>
                      </q-td>
                    </template>
                  </q-tr>
                </template>
              </q-table>
            </div>
          </q-expansion-item>
        </template>
      </q-list>

      <!-- Show loading state if no data -->
      <q-card-section v-else>
        <q-spinner color="primary" size="2em" /> Loading tasks...
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped>
/* Align tables to the left */
.compact-table {
  max-width: 900px;
  margin-left: 0; /* Align left */
}

/* Reduce padding and margins */
.dense-table {
  display: flex;
  justify-content: flex-start; /* Align left */
}

/* Reduce row height */
.dense-row {
  height: 35px !important;
}

/* Reduce header size */
.dense-header {
  font-size: 14px !important;
  padding: 6px 8px !important;
}

/* Reduce checkbox size */
.dense-checkbox ::v-deep(.q-checkbox__label) {
  font-size: 12px !important;
  padding-left: 2px !important;
}

/* Reduce cell padding */
.dense-cell {
  padding: 4px !important;
  text-align: center !important;
}

/* Slightly bigger text */
.medium-text {
  font-size: 14px !important;
}
</style>

<script>
export default {
  props: {
    tasks: Array,
    admin: {
      type: String,
      default: 'N',
    },
  },

  data() {
    return {
      groupedTasks: {},
      // Change selectedTasks to an array so we can store a list of selections.
      selectedTasks: [],
      selectedAlternatives: {},
      categoryDates: {},
      expandedCategories: {}, // Track expanded state of each category
    }
  },
  watch: {
    tasks: {
      immediate: true,
      deep: true,
      handler(newTasks) {
        this.processTasks(newTasks)
        // Make sure to update the selectedTasks if needed
        this.updateSelectedTasks()
      },
    },
  },
  methods: {
    processTasks(tasks) {
      if (!tasks || tasks.length === 0) return

      this.groupedTasks = {}
      this.categoryDates = {}
      this.expandedCategories = {} // Reset expanded state

      tasks.forEach((task) => {
        const formattedDate = this.convertDateFormat(task.datum)

        if (!this.groupedTasks[task.soort]) {
          this.groupedTasks[task.soort] = {}
          this.categoryDates[task.soort] = new Set()
          this.expandedCategories[task.soort] = false // Default to collapsed
        }

        if (!this.groupedTasks[task.soort][task.taakomschrijving]) {
          this.groupedTasks[task.soort][task.taakomschrijving] = {}
        }

        this.groupedTasks[task.soort][task.taakomschrijving][formattedDate] = {
          eerstekeus: task.eerstekeus || 'N',
          tweedekeus: task.tweedekeus || 'N',
          alternatief: task.alternatief || 'N',
        }

        this.categoryDates[task.soort].add(formattedDate)
      })

      Object.keys(this.categoryDates).forEach((soort) => {
        this.categoryDates[soort] = Array.from(this.categoryDates[soort]).sort()
      })
    },
    getCategoryDates(category) {
      return this.categoryDates[category] || []
    },
    getCategoryColumns(category) {
      return [
        { name: 'task', label: 'Task', align: 'left', field: 'task' },
        ...this.getCategoryDates(category).map((date) => ({
          name: date,
          label: this.getWeekday(date) + '\n' + this.formatDate(date),
          align: 'center',
          field: date,
        })),
      ]
    },
    formatRows(tasksByDate, category) {
      return Object.entries(tasksByDate)
        .sort(([taskA], [taskB]) => taskA.localeCompare(taskB))
        .map(([task, dates]) => {
          const row = { task }
          this.getCategoryDates(category).forEach((date) => {
            row[date] = dates[date] || null
          })
          return row
        })
    },
    updateSelection(category, task, date, field, value) {
      // Update the selection for the given task/date
      this.groupedTasks[category][task][date][field] = value

      // If the first choice is being deselected, reset tweedekeus for all tasks on that date.
      if (field === 'eerstekeus' && value === 'N') {
        const tasksForCategory = this.groupedTasks[category]
        Object.keys(tasksForCategory).forEach((taskName) => {
          if (tasksForCategory[taskName][date]) {
            tasksForCategory[taskName][date].tweedekeus = 'N'
          }
        })
      }
      // After updating, refresh our selectedTasks
      this.updateSelectedTasks()
    },
    // New helper method to update selectedTasks
    updateSelectedTasks() {
      const selectedByDate = {}

      // Loop over every category and task in the groupedTasks
      for (const category in this.groupedTasks) {
        for (const task in this.groupedTasks[category]) {
          for (const date in this.groupedTasks[category][task]) {
            const selection = this.groupedTasks[category][task][date]
            // Only process if either choice is selected
            if (selection.eerstekeus === 'Y' || selection.tweedekeus === 'Y') {
              if (!selectedByDate[date]) {
                selectedByDate[date] = {
                  date: date,
                  eerstekeus: null,
                  tweedekeus: null,
                }
              }
              if (selection.eerstekeus === 'Y') {
                selectedByDate[date].eerstekeus = task
              }
              if (selection.tweedekeus === 'Y') {
                selectedByDate[date].tweedekeus = task
              }
            }
          }
        }
      }
      // Convert the object into an array of selections
      this.selectedTasks = Object.values(selectedByDate)

      this.$emit('update:selected-tasks', Object.values(selectedByDate))
    },
    convertDateFormat(dateString) {
      const parts = dateString.split('/')
      return `${parts[2]}-${parts[1]}-${parts[0]}`
    },
    formatDate(date) {
      const parts = date.split('-')
      return `${parts[2]}/${parts[1]}`
    },
    getWeekday(date) {
      const weekdays = [
        'Zondag',
        'Maandag',
        'Dinsdag',
        'Woensdag',
        'Donderdag',
        'Vrijdag',
        'Zaterdag',
      ]
      return weekdays[new Date(date).getDay()]
    },
    isEersteKeusSelectedForDate(category, date) {
      const tasksForCategory = this.groupedTasks[category]
      if (!tasksForCategory) return false
      return Object.keys(tasksForCategory).some((taskName) => {
        const taskData = tasksForCategory[taskName][date]
        return taskData && taskData.eerstekeus === 'Y'
      })
    },
    getSelectedTaskAlternatief(category, date) {
      const tasksForCategory = this.groupedTasks[category]
      if (!tasksForCategory) return null
      for (const taskName in tasksForCategory) {
        const taskData = tasksForCategory[taskName][date]
        if (taskData && taskData.eerstekeus === 'Y') {
          return taskData.alternatief
        }
      }
      return null
    },
    isTweedeKeusSelectedForDate(category, date) {
      const tasksForCategory = this.groupedTasks[category]
      if (!tasksForCategory) return false
      return Object.keys(tasksForCategory).some((taskName) => {
        const taskData = tasksForCategory[taskName][date]
        return taskData && taskData.tweedekeus === 'Y'
      })
    },
    canSwap(category, date) {
      const tasksForCategory = this.groupedTasks[category]
      if (!tasksForCategory) return false
      let hasFirst = false
      let hasAlt = false
      for (const taskName in tasksForCategory) {
        const taskData = tasksForCategory[taskName][date]
        if (taskData) {
          if (taskData.eerstekeus === 'Y') {
            hasFirst = true
          }
          if (taskData.tweedekeus === 'Y') {
            hasAlt = true
          }
        }
      }
      return hasFirst && hasAlt
    },
    // Swap the selections for the given day:
    // The task that had tweedekeus becomes first choice and vice versa.
    swapSelections(category, date) {
      const tasksForCategory = this.groupedTasks[category]
      if (!tasksForCategory) return

      let firstTaskKey = null
      let altTaskKey = null

      // Identify the task with eerstekeus and the one with tweedekeus
      Object.keys(tasksForCategory).forEach((taskName) => {
        const taskData = tasksForCategory[taskName][date]
        if (taskData) {
          if (taskData.eerstekeus === 'Y') {
            firstTaskKey = taskName
          }
          if (taskData.tweedekeus === 'Y') {
            altTaskKey = taskName
          }
        }
      })

      // If both are found, swap their selections:
      if (firstTaskKey && altTaskKey) {
        // For the originally selected first choice:
        this.groupedTasks[category][firstTaskKey][date].eerstekeus = 'N'
        this.groupedTasks[category][firstTaskKey][date].tweedekeus = 'Y'

        // For the originally selected alternative:
        this.groupedTasks[category][altTaskKey][date].eerstekeus = 'Y'
        this.groupedTasks[category][altTaskKey][date].tweedekeus = 'N'
      }
      // After swapping, update the selected tasks list
      this.updateSelectedTasks()
    },
  },
}
</script>
