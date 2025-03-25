<template>
  <div class="app-container">
    <header>
      <h1>Kanban Todo App</h1>
      <div class="header-actions">
        <button @click="openAddTodoModal" v-if="!isSettingsOpen">
          + Add Todo
        </button>
        <button @click="toggleSettings" class="settings-btn">
          {{ isSettingsOpen ? "Back to Board" : "⚙️ Settings" }}
        </button>
      </div>
    </header>

    <KanbanBoard
      v-if="!isSettingsOpen"
      :columns="columns"
      :todos="todos"
      @update-todos="updateTodos"
      @edit-todo="openEditTodoModal"
      @delete-todo="deleteTodo"
      @update-checklist-item="updateChecklistItem"
    />

    <Settings
      v-else
      :columns="columns"
      :todos="todos"
      @update-columns="updateColumns"
      @update-todos="updateTodos"
      @close="toggleSettings"
    />

    <TodoModal
      v-if="isModalOpen"
      :todo="currentTodo"
      :column-id="currentColumnId"
      @save="saveTodo"
      @close="closeModal"
    />
  </div>
</template>

<script>
import KanbanBoard from "./components/KanbanBoard.vue";
import TodoModal from "./components/TodoModal.vue";
import Settings from "./components/SettingPage.vue";
import StorageService from "./services/StorageService";

export default {
  name: "App",
  components: {
    KanbanBoard,
    TodoModal,
    Settings,
  },
  data() {
    return {
      storageService: new StorageService(),
      columns: [],
      todos: {},
      isModalOpen: false,
      currentTodo: null,
      currentColumnId: null,
      isEditing: false,
      isSettingsOpen: false,
    };
  },
  created() {
    this.loadData();
  },
  methods: {
    loadData() {
      this.columns = this.storageService.getColumns();
      this.todos = this.storageService.getTodos();
    },

    updateColumns(newColumns) {
      this.columns = newColumns;
      this.storageService.saveColumns(newColumns);
    },

    updateTodos(newTodos) {
      this.todos = newTodos;
      this.storageService.saveTodos(newTodos);
    },

    openAddTodoModal() {
      this.isEditing = false;
      this.currentTodo = {
        title: "",
        description: "",
        checklist: [],
      };
      this.isModalOpen = true;
    },

    openEditTodoModal(todo, columnId) {
      this.isEditing = true;
      this.currentTodo = { ...todo };
      this.currentColumnId = columnId;
      this.isModalOpen = true;
    },

    closeModal() {
      this.isModalOpen = false;
      this.currentTodo = null;
      this.currentColumnId = null;
    },

    toggleSettings() {
      this.isSettingsOpen = !this.isSettingsOpen;
    },

    saveTodo(todo) {
      if (this.isEditing && this.currentColumnId) {
        // Update existing todo
        const columnTodos = [...this.todos[this.currentColumnId]];
        const index = columnTodos.findIndex((t) => t.id === todo.id);

        if (index !== -1) {
          columnTodos[index] = todo;
          const updatedTodos = {
            ...this.todos,
            [this.currentColumnId]: columnTodos,
          };
          this.updateTodos(updatedTodos);
        }
      } else {
        // Add new todo to first column
        const firstColumnId = this.columns[0].id;
        todo.id = this.generateId();

        const updatedTodos = {
          ...this.todos,
          [firstColumnId]: [...this.todos[firstColumnId], todo],
        };
        this.updateTodos(updatedTodos);
      }

      this.closeModal();
    },

    deleteTodo(columnId, todoId) {
      if (confirm("Are you sure you want to delete this todo?")) {
        const columnTodos = this.todos[columnId].filter(
          (todo) => todo.id !== todoId
        );
        const updatedTodos = { ...this.todos, [columnId]: columnTodos };
        this.updateTodos(updatedTodos);
      }
    },

    updateChecklistItem(columnId, todoId, itemIndex, isCompleted) {
      const columnTodos = [...this.todos[columnId]];
      const todoIndex = columnTodos.findIndex((todo) => todo.id === todoId);

      if (todoIndex !== -1 && columnTodos[todoIndex].checklist[itemIndex]) {
        const updatedTodo = { ...columnTodos[todoIndex] };
        updatedTodo.checklist[itemIndex].completed = isCompleted;

        columnTodos[todoIndex] = updatedTodo;
        const updatedTodos = { ...this.todos, [columnId]: columnTodos };
        this.updateTodos(updatedTodos);
      }
    },

    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
  },
};
</script>

<style lang="scss">
@use "./assets/styles";

.header-actions {
  display: flex;
  gap: 15px;

  .settings-btn {
    background-color: #6c757d;

    &:hover {
      background-color: #5a6268;
    }
  }
}
</style>
