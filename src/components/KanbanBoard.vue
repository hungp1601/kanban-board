<template>
  <main id="kanban-board">
    <LoadingSpinner
      v-if="isMovingTodo"
      overlay
      :message="$t('kanban.movingTask')"
    />

    <div
      class="kanban-columns-container"
      ref="columnContainer"
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="stopDrag"
      @mouseleave="stopDrag"
      @touchstart="startTouchDrag"
      @touchmove="onTouchDrag"
      @touchend="stopDrag"
    >
      <KanbanColumn
        v-for="column in columns"
        :key="column.id"
        :column="column"
        :todos="todos[column.id] || []"
        @edit-todo="$emit('edit-todo', $event, column.id)"
        @delete-todo="$emit('delete-todo', column.id, $event)"
        @update-checklist-item="
          (todoId, itemIndex, isCompleted) =>
            $emit(
              'update-checklist-item',
              column.id,
              todoId,
              itemIndex,
              isCompleted
            )
        "
        @move-todo="moveTodo"
        @reorder-todo="reorderTodo"
      />
    </div>
  </main>
</template>

<script>
import KanbanColumn from "./KanbanColumn.vue";
import LoadingSpinner from "./LoadingSpinner.vue";

export default {
  name: "KanbanBoard",
  components: {
    KanbanColumn,
    LoadingSpinner,
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
  emits: ["update-todos", "edit-todo", "delete-todo", "update-checklist-item"],
  data() {
    return {
      isDragging: false,
      startX: 0,
      scrollLeft: 0,
      isScrolling: false,
      isMovingTodo: false,
    };
  },
  methods: {
    moveTodo(fromColumnId, toColumnId, todoId) {
      if (this.isMovingTodo) return; // Prevent recursive calls
      this.isMovingTodo = true;
      console.log(
        `Moving todo ${todoId} from ${fromColumnId} to ${toColumnId}`
      );

      try {
        if (!this.todos[fromColumnId]) {
          throw new Error(`Source column ${fromColumnId} not found`);
        }

        // Ensure target column array exists
        if (!this.todos[toColumnId]) {
          this.todos = { ...this.todos, [toColumnId]: [] };
        }

        const fromTodos = [...this.todos[fromColumnId]];
        const toTodos = [...(this.todos[toColumnId] || [])];

        const todoIndex = fromTodos.findIndex((todo) => todo.id === todoId);
        if (todoIndex !== -1) {
          const todo = { ...fromTodos[todoIndex] };
          fromTodos.splice(todoIndex, 1);

          // Clean up tracking properties
          delete todo.sourceColumn;

          toTodos.push(todo);

          const updatedTodos = {
            ...this.todos,
            [fromColumnId]: fromTodos,
            [toColumnId]: toTodos,
          };

          // Only emit if the structure actually changed
          if (JSON.stringify(updatedTodos) !== JSON.stringify(this.todos)) {
            this.$emit("update-todos", updatedTodos);
          }
        } else {
          throw new Error(`Todo ${todoId} not found in column ${fromColumnId}`);
        }
      } catch (error) {
        console.error(error);
        // Add user feedback here if needed
      } finally {
        // Reduce timeout from 300ms to 100ms
        setTimeout(() => {
          this.isMovingTodo = false;
        }, 100);
      }
    },

    reorderTodo(columnId, newTodos) {
      // Skip if the array is empty or identical
      if (JSON.stringify(newTodos) === JSON.stringify(this.todos[columnId])) {
        return;
      }

      // Ensure the column exists in the todos object
      if (!this.todos[columnId]) {
        this.todos = { ...this.todos, [columnId]: [] };
      }

      // Process each todo to ensure it has proper structure
      const cleanTodos = newTodos.map((todo) => {
        // Create a clean copy of the todo
        const cleanTodo = { ...todo };

        // Mark the source column for items coming from other columns
        if (todo.sourceColumn === undefined && todo.id !== undefined) {
          // Find the original column for this todo
          for (const [colId, todos] of Object.entries(this.todos)) {
            if (colId !== columnId && todos.some((t) => t.id === todo.id)) {
              cleanTodo.sourceColumn = colId;
              break;
            }
          }
        }
        return cleanTodo;
      });

      const updatedTodos = {
        ...this.todos,
        [columnId]: cleanTodos,
      };

      // Only emit if the structure actually changed
      if (JSON.stringify(updatedTodos) !== JSON.stringify(this.todos)) {
        this.$emit("update-todos", updatedTodos);
      }
    },

    startDrag(e) {
      // Only start dragging if we're not interacting with a child element
      if (e.target.closest(".column-content, .todo-item, button")) {
        return;
      }

      const container = this.$refs.columnContainer;
      this.isDragging = true;
      this.startX = e.pageX - container.offsetLeft;
      this.scrollLeft = container.scrollLeft;
      container.style.cursor = "grabbing";
      container.style.userSelect = "none";
      e.preventDefault();
    },

    onDrag(e) {
      if (!this.isDragging) return;

      const container = this.$refs.columnContainer;
      const x = e.pageX - container.offsetLeft;
      const walk = (x - this.startX) * 3; // Increased from 1.5 to 3 for faster scrolling
      container.scrollLeft = this.scrollLeft - walk;
      this.isScrolling = true;
    },

    stopDrag() {
      const container = this.$refs.columnContainer;
      this.isDragging = false;
      container.style.cursor = "grab";
      container.style.removeProperty("user-select");

      // Reduce timeout from 100ms to 50ms for more responsive feel
      setTimeout(() => {
        this.isScrolling = false;
      }, 50);
    },

    startTouchDrag(e) {
      if (e.target.closest(".column-content, .todo-item, button")) {
        return;
      }

      const container = this.$refs.columnContainer;
      this.isDragging = true;
      this.startX = e.touches[0].pageX - container.offsetLeft;
      this.scrollLeft = container.scrollLeft;
      // Prevent default to avoid browser handling the touch event
      e.preventDefault();
    },

    onTouchDrag(e) {
      if (!this.isDragging) return;

      const container = this.$refs.columnContainer;
      const x = e.touches[0].pageX - container.offsetLeft;
      const walk = (x - this.startX) * 1.5;
      container.scrollLeft = this.scrollLeft - walk;
      this.isScrolling = true;
      e.preventDefault();
    },
  },
};
</script>

<style lang="scss" scoped>
.kanban-columns-container {
  display: flex;
  flex-direction: row;
  gap: 30px;
  flex-grow: 1;
  overflow-x: auto;
  min-height: 500px;
  padding: 10px;
  cursor: grab;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* Improves scrolling on iOS devices */

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
}
</style>
