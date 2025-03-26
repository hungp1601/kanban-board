<template>
  <div class="settings-container">
    <h2>{{ $t("settings.title") }}</h2>

    <LoadingSpinner v-if="loading" :message="$t('app.dataLoading')" />

    <div v-else>
      <div class="settings-section">
        <h3>{{ $t("settings.language") }}</h3>
        <div class="language-settings">
          <p class="language-description">
            {{ $t("settings.selectLanguage") }}
          </p>
          <LanguageSelector />
        </div>
      </div>

      <div class="settings-section">
        <h3>{{ $t("settings.columnManagement") }}</h3>

        <draggable
          v-model="localColumns"
          group="columns-settings"
          handle=".drag-handle"
          item-key="id"
          :animation="200"
          class="columns-list"
          @change="updateColumns"
        >
          <template #item="{ element }">
            <div class="column-item">
              <div class="column-info">
                <span class="drag-handle"
                  ><i class="fas fa-grip-vertical"></i
                ></span>
                <span class="column-name">{{ element.name }}</span>
              </div>
              <div class="column-actions">
                <button @click="editColumn(element.id)">
                  ✏️ {{ $t("settings.editColumn") }}
                </button>
                <button @click="deleteColumn(element.id)" class="delete-btn">
                  🗑️ {{ $t("settings.deleteColumn") }}
                </button>
              </div>
            </div>
          </template>
        </draggable>

        <div class="add-column">
          <input
            type="text"
            v-model="newColumnName"
            :placeholder="$t('settings.newColumnPlaceholder')"
            @keyup.enter="addNewColumn"
          />
          <button
            @click="addNewColumn"
            :disabled="!newColumnName.trim() || loading"
          >
            {{ $t("settings.addColumn") }}
          </button>
        </div>
      </div>
    </div>

    <div class="settings-footer">
      <button @click="$emit('close')" class="back-btn">
        {{ $t("app.backToBoard") }}
      </button>
    </div>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import LoadingSpinner from "./LoadingSpinner.vue";
import LanguageSelector from "./LanguageSelector.vue";

export default {
  components: {
    draggable,
    LoadingSpinner,
    LanguageSelector,
  },
  props: {
    columns: {
      type: Array,
      required: true,
    },
    todos: {
      type: Object,
      required: true,
    },
  },
  emits: ["update-columns", "update-todos", "close"],
  data() {
    return {
      newColumnName: "",
      loading: false,
    };
  },
  computed: {
    localColumns: {
      get() {
        return this.columns;
      },
      set(value) {
        this.$emit(
          "update-columns",
          value.map((col, idx) => ({
            ...col,
            order: idx,
          }))
        );
      },
    },
  },
  methods: {
    updateColumns() {
      // The localColumns setter handles the update
    },

    async addNewColumn() {
      if (!this.newColumnName.trim() || this.loading) return;

      this.loading = true;

      try {
        const newColumn = {
          id: `column-${Date.now().toString(36)}`,
          name: this.newColumnName.trim(),
          order: this.columns.length,
        };

        const updatedColumns = [...this.columns, newColumn];
        this.$emit("update-columns", updatedColumns);

        // Initialize empty todos array for the new column
        const updatedTodos = { ...this.todos, [newColumn.id]: [] };
        this.$emit("update-todos", updatedTodos);

        // Reset input
        this.newColumnName = "";
      } finally {
        // Reduce timeout from 500ms to 100ms
        setTimeout(() => {
          this.loading = false;
        }, 100);
      }
    },

    async editColumn(columnId) {
      const column = this.columns.find((col) => col.id === columnId);
      if (column) {
        const newName = prompt("Enter new column name:", column.name);
        if (newName !== null && newName.trim()) {
          this.loading = true;

          try {
            const updatedColumns = this.columns.map((col) =>
              col.id === columnId ? { ...col, name: newName.trim() } : col
            );
            this.$emit("update-columns", updatedColumns);
          } finally {
            // Reduce timeout from 500ms to 100ms
            setTimeout(() => {
              this.loading = false;
            }, 100);
          }
        }
      }
    },

    async deleteColumn(columnId) {
      if (confirm(this.$t("settings.confirmDeleteColumn"))) {
        this.loading = true;

        try {
          const updatedColumns = this.columns
            .filter((col) => col.id !== columnId)
            .map((col, idx) => ({ ...col, order: idx }));

          const updatedTodos = { ...this.todos };
          delete updatedTodos[columnId];

          this.$emit("update-columns", updatedColumns);
          this.$emit("update-todos", updatedTodos);
        } finally {
          // Reduce timeout from 500ms to 100ms
          setTimeout(() => {
            this.loading = false;
          }, 100);
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use "../assets/variables" as *;
@use "sass:color";

.settings-container {
  max-width: 800px;
  max-height: 80vh; // Set maximum height to 80% of viewport height
  overflow-y: auto; // Enable vertical scrolling when content overflows
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: $shadow-medium;
}

h2 {
  margin-bottom: 20px;
  color: $text-dark;
  border-bottom: 1px solid $border-color;
  padding-bottom: 10px;
}

.settings-section {
  margin-bottom: 30px;

  h3 {
    margin-bottom: 15px;
    color: $text-color;
  }
}

.columns-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.column-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: $light-grey;
  border-radius: 5px;
  box-shadow: $shadow-light;
  &:hover {
    background-color: color.adjust($light-grey, $lightness: -3%);
  }
}

.column-info {
  display: flex;
  align-items: center;
  gap: 10px;

  .drag-handle {
    cursor: grab;
    color: #888;
    font-size: 16px;

    &:active {
      cursor: grabbing;
    }

    &:hover {
      color: $text-dark;
    }
  }

  .column-name {
    font-weight: bold;
    color: $text-dark;
  }
}

.column-actions {
  display: flex;
  gap: 10px;

  button {
    padding: 6px 12px;
    font-size: 13px;
    background-color: white;
    color: $text-color;
    border: 1px solid $border-color;

    &.delete-btn {
      color: $danger-color;

      &:hover {
        background-color: $danger-color;
        color: white;
      }
    }
  }
}

.add-column {
  display: flex;
  margin-top: 15px;
  gap: 10px;

  input {
    flex-grow: 1;
    padding: 10px;
    border: 1px solid $border-color;
    border-radius: 4px;

    &:focus {
      outline: none;
      border-color: $secondary-color;
    }
  }

  button {
    background-color: $secondary-color;
    color: white;
    width: 200px;

    &:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  }
}

.settings-footer {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;

  .back-btn {
    background-color: $info-color;

    &:hover {
      background-color: $info-hover;
    }
  }
}

.language-settings {
  margin-bottom: 20px;

  .language-description {
    margin-bottom: 10px;
    color: #666;
  }
}
</style>
