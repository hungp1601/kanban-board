<template>
  <div class="modal">
    <div class="modal-content">
      <span class="close" @click="$emit('close')">&times;</span>
      <h2>{{ todo.id ? "Edit Todo" : "Add New Todo" }}</h2>

      <form @submit.prevent="saveTodo">
        <div class="form-group">
          <label for="todoTitle">Title:</label>
          <input
            type="text"
            id="todoTitle"
            v-model="localTodo.title"
            required
          />
        </div>

        <div class="form-group">
          <label for="todoDescription">Description:</label>
          <ckeditor
            :editor="editor"
            v-model="localTodo.description"
            :config="editorConfig"
          />
        </div>

        <div class="form-group">
          <label>Checklist:</label>
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
            + Add Item
          </button>
        </div>

        <div class="form-group">
          <button type="submit" id="saveBtn">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

export default {
  name: "TodoModal",
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

    saveTodo() {
      // Remove empty checklist items
      const checklist = this.localTodo.checklist.filter(
        (item) => item.text.trim() !== ""
      );

      // Create a cleaned todo object
      const todoToSave = {
        ...this.localTodo,
        checklist,
      };

      this.$emit("save", todoToSave);
    },
  },
};
</script>

<style lang="scss" scoped>
// Add scss styles if needed
</style>
