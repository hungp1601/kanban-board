<template>
  <div class="app-container">
    <LoadingSpinner
      v-if="initialLoading"
      overlay
      :message="$t('app.loading')"
    />

    <div v-else>
      <!-- Authentication screen -->
      <Login v-if="!user" @auth-success="onAuthSuccess" />

      <!-- Main application when authenticated -->
      <div v-else>
        <header>
          <h1>{{ $t("app.title") }}</h1>
          <div class="header-actions">
            <span class="user-info">{{ user.displayName || user.email }}</span>
            <button @click="openAddTodoModal" v-if="!isSettingsOpen">
              {{ $t("kanban.addTodo") }}
            </button>
            <button @click="toggleSettings" class="settings-btn">
              {{
                isSettingsOpen
                  ? $t("app.backToBoard")
                  : "⚙️ " + $t("app.settings")
              }}
            </button>
            <button @click="logout" class="logout-btn">
              {{ $t("app.logout") }}
            </button>
            <LanguageSelector class="language-selector" />
          </div>
        </header>

        <div v-if="loading" class="loading-container">
          <LoadingSpinner :message="$t('app.dataLoading')" />
        </div>

        <template v-else>
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
        </template>

        <TodoModal
          v-if="isModalOpen"
          :todo="currentTodo"
          :column-id="currentColumnId"
          @save="saveTodo"
          @close="closeModal"
        />
      </div>
    </div>
  </div>
</template>

<script>
import KanbanBoard from "./components/KanbanBoard.vue";
import TodoModal from "./components/TodoModal.vue";
import Settings from "./components/SettingPage.vue";
import StorageService from "./services/StorageService";
import Login from "./components/Login.vue";
import LoadingSpinner from "./components/LoadingSpinner.vue";
import AuthService from "./services/AuthService";
import LanguageSelector from "./components/LanguageSelector.vue";
import SessionService from "./services/SessionService";

export default {
  name: "App",
  components: {
    KanbanBoard,
    TodoModal,
    Settings,
    Login,
    LoadingSpinner,
    LanguageSelector,
  },
  props: {
    initialState: {
      type: Object,
      default: null,
    },
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
      user: null,
      loading: false,
      initialLoading: true,
      unsubscribeAuth: null,
      loadingTimeout: null,
    };
  },
  created() {
    // Handle initial state if provided from main.js
    if (this.initialState && this.initialState.user) {
      this.user = this.initialState.user;
      this.loadData();
    }

    // Only show initial loading state for max 3 seconds, then show the auth screen anyway
    this.loadingTimeout = setTimeout(() => {
      this.initialLoading = false;
    }, 3000);

    // Check for existing session before waiting for Firebase
    const existingSession = SessionService.getSession();
    if (existingSession) {
      this.user = existingSession;
      // Attempt to load data with session info
      this.loadData();
    }

    // Listen for auth state changes
    this.unsubscribeAuth = AuthService.onAuthStateChange(async (user) => {
      this.user = user;

      // Clear the loading timeout since we got a response
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
      }

      if (user) {
        await this.loadData();
      }

      this.initialLoading = false;
    });
  },
  beforeUnmount() {
    // Clean up auth listener and any pending timeouts
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
  },
  methods: {
    async loadData() {
      // this.loading = true;

      // Set a timeout to clear the loading state after 5 seconds
      // even if the data loading fails
      const loadingTimeout = setTimeout(() => {
        // this.loading = false;
        console.warn("Data loading timeout reached, continuing with app");
      }, 5000);

      try {
        // Use Promise.all for parallel loading to improve speed
        const [columnsData, todosData] = await Promise.all([
          this.storageService.getColumns(),
          this.storageService.getTodos(),
        ]);

        // Set data only after both promises have resolved
        this.columns = columnsData;
        this.todos = todosData;
      } catch (error) {
        console.error("Error loading data:", error);
        // Show error message to user
        alert("Error loading data: " + error.message);
      } finally {
        clearTimeout(loadingTimeout);
        this.loading = false;
      }
    },

    async onAuthSuccess() {
      await this.loadData();
    },

    async logout() {
      try {
        this.initialLoading = true;
        await AuthService.logout();
        // Reset application state
        this.columns = [];
        this.todos = {};
        // Auth state listener will handle UI update
      } catch (error) {
        console.error("Logout failed:", error);
      } finally {
        this.initialLoading = false;
      }
    },

    async updateColumns(newColumns) {
      // this.loading = true;

      // Set a timeout to clear the loading state after 3 seconds
      const loadingTimeout = setTimeout(() => {
        // this.loading = false;
      }, 3000);

      try {
        await this.storageService.saveColumns(newColumns);
        this.columns = newColumns;

        // Ensure all columns exist in the todos object
        const updatedTodos = { ...this.todos };
        newColumns.forEach((column) => {
          if (!updatedTodos[column.id]) {
            updatedTodos[column.id] = [];
          }
        });

        // Save the updated todos with new columns
        if (JSON.stringify(updatedTodos) !== JSON.stringify(this.todos)) {
          await this.storageService.saveTodos(updatedTodos);
          this.todos = updatedTodos;
        }
      } catch (error) {
        console.error("Failed to update columns:", error);
      } finally {
        clearTimeout(loadingTimeout);
        // this.loading = false;
      }
    },

    async updateTodos(newTodos) {
      if (this.loading) return; // Prevent recursive calls when already loading

      // this.loading = true;

      // Set a timeout to clear the loading state after 3 seconds
      const loadingTimeout = setTimeout(() => {
        // this.loading = false;
      }, 3000);

      try {
        // Ensure all columns exist in the todos object
        const ensuredTodos = { ...newTodos };
        this.columns.forEach((column) => {
          if (!ensuredTodos[column.id]) {
            ensuredTodos[column.id] = [];
          }
        });

        await this.storageService.saveTodos(ensuredTodos);
        // Directly assign the ensuredTodos to avoid a second render cycle
        this.todos = ensuredTodos;
      } catch (error) {
        console.error("Failed to update todos:", error);
      } finally {
        clearTimeout(loadingTimeout);
        // this.loading = false;
      }
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

    async saveTodo(todo) {
      // this.loading = true;

      try {
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
            await this.storageService.saveTodos(updatedTodos);
            // this.todos = updatedTodos;
            this.closeModal(); // Close modal first before any potential errors
          }
        } else {
          // Add new todo to first column
          const firstColumnId = this.columns[0].id;
          todo.id = this.generateId();

          const updatedTodos = {
            ...this.todos,
            [firstColumnId]: [...this.todos[firstColumnId], todo],
          };
          await this.storageService.saveTodos(updatedTodos);
          this.todos = updatedTodos;
          this.closeModal(); // Close modal first before any potential errors
        }
      } catch (error) {
        console.error("Failed to save todo:", error);
        alert("Failed to save todo: " + error.message);
      } finally {
        // this.loading = false;
      }
    },

    async deleteTodo(columnId, todoId) {
      if (confirm(this.$t("todo.confirmDelete"))) {
        // this.loading = true;

        try {
          const columnTodos = this.todos[columnId].filter(
            (todo) => todo.id !== todoId
          );
          const updatedTodos = { ...this.todos, [columnId]: columnTodos };
          await this.storageService.saveTodos(updatedTodos);
          this.todos = updatedTodos;
        } catch (error) {
          console.error("Failed to delete todo:", error);
        } finally {
          // this.loading = false;
        }
      }
    },

    async updateChecklistItem(columnId, todoId, itemIndex, isCompleted) {
      // this.loading = true;

      try {
        const columnTodos = [...this.todos[columnId]];
        const todoIndex = columnTodos.findIndex((todo) => todo.id === todoId);

        if (todoIndex !== -1 && columnTodos[todoIndex].checklist[itemIndex]) {
          const updatedTodo = { ...columnTodos[todoIndex] };
          updatedTodo.checklist[itemIndex].completed = isCompleted;

          columnTodos[todoIndex] = updatedTodo;
          const updatedTodos = { ...this.todos, [columnId]: columnTodos };
          await this.storageService.saveTodos(updatedTodos);
          this.todos = updatedTodos;
        }
      } catch (error) {
        console.error("Failed to update checklist item:", error);
      } finally {
        // this.loading = false;
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
  align-items: center;

  .language-selector {
    margin-right: 5px;
  }

  .user-info {
    margin-right: 15px;
    font-size: 14px;
    color: #ffffff;
    background-color: #495057; /* Darker background for better contrast */
    padding: 5px 10px;
    border-radius: 4px;
    font-weight: 600; /* Make text slightly bolder */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .settings-btn {
    background-color: #6c757d;

    &:hover {
      background-color: #5a6268;
    }
  }

  .logout-btn {
    background-color: #dc3545;

    &:hover {
      background-color: #c82333;
    }
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}
</style>
