<template>
  <div class="modal">
    <div class="modal-content">
      <span class="close" @click="closeModal">&times;</span>
      <h2>{{ todo.id ? $t("todo.edit") : $t("todo.add") }}</h2>

      <LoadingSpinner v-if="saving" overlay :message="$t('todo.saving')" />

      <form @submit.prevent="saveTodo">
        <div class="form-group">
          <label for="todoTitle">{{ $t("todo.title") }}</label>
          <input
            type="text"
            id="todoTitle"
            v-model="localTodo.title"
            required
          />
        </div>

        <div class="form-group">
          <label for="todoDescription">{{ $t("todo.description") }}</label>
          <ckeditor
            :editor="editor"
            v-model="localTodo.description"
            :config="editorConfig"
          />
        </div>

        <div class="form-group">
          <label>{{ $t("todo.checklist") }}</label>
          <div id="checklistContainer">
            <div
              class="checklist-item-container"
              v-for="(item, index) in localTodo.checklist"
              :key="index"
            >
              <input
                type="checkbox"
                v-model="item.completed"
                class="checklist-item-completed"
              />
              <input
                type="text"
                v-model="item.text"
                class="checklist-item-text"
                placeholder="List item"
              />
              <button type="button" @click="removeChecklistItem(index)">
                ×
              </button>
            </div>
          </div>
          <button
            type="button"
            id="addChecklistItemBtn"
            @click="addChecklistItem"
          >
            {{ $t("todo.addItem") }}
          </button>
        </div>

        <div class="form-group">
          <button type="submit" id="saveBtn" :disabled="saving">
            {{ $t("todo.save") }}
          </button>
          <button
            type="button"
            class="cancel-btn"
            @click="closeModal"
            :disabled="saving"
          >
            {{ $t("todo.cancel") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import LoadingSpinner from "./LoadingSpinner.vue";

export default {
  name: "TodoModal",
  components: {
    LoadingSpinner,
  },
  props: {
    todo: {
      type: Object,
      required: true,
    },
    columnId: {
      type: String,
      default: null,
    },
  },
  emits: ["save", "close"],
  data() {
    return {
      editor: ClassicEditor,
      editorConfig: {
        toolbar: [
          "heading",
          "|",
          "bold",
          "italic",
          "link",
          "bulletedList",
          "numberedList",
          "blockQuote",
        ],
      },
      localTodo: {
        id: "",
        title: "",
        description: "",
        checklist: [],
      },
      saving: false,
    };
  },
  created() {
    // Deep clone the todo to avoid modifying props directly
    this.localTodo = JSON.parse(JSON.stringify(this.todo));
  },
  methods: {
    addChecklistItem() {
      this.localTodo.checklist.push({
        text: "",
        completed: false,
      });
    },

    removeChecklistItem(index) {
      this.localTodo.checklist.splice(index, 1);
    },

    closeModal() {
      if (!this.saving) {
        this.$emit("close");
      }
    },

    async saveTodo() {
      this.saving = true;

      try {
        // Remove empty checklist items
        const checklist = this.localTodo.checklist.filter(
          (item) => item.text.trim() !== ""
        );

        // Create a cleaned todo object
        const todoToSave = {
          ...this.localTodo,
          checklist,
          updatedAt: new Date().toISOString(), // Add timestamp for local tracking
        };

        this.$emit("save", todoToSave);
      } catch (error) {
        console.error("Error preparing todo for save:", error);
        this.saving = false; // Reset saving state if there's an error
        alert("Error preparing todo: " + error.message);
      } finally {
        // The parent component will close this modal when done
        setTimeout(() => {
          this.saving = false;
        }, 500);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
// Add scss styles if needed
.modal-content {
  position: relative;
  background-color: white;
  border-radius: 8px;
  padding: 25px;
  width: 80%;
  max-width: 600px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.cancel-btn {
  background-color: #6c757d;
  margin-left: 10px;

  &:hover {
    background-color: #5a6268;
  }
}
</style>
