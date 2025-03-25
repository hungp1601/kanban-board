<template>
  <main id="kanban-board">
    <div class="kanban-columns-container">
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

export default {
  name: "KanbanBoard",
  components: {
    KanbanColumn,
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
  methods: {
    moveTodo(fromColumnId, toColumnId, todoId) {
      console.log(
        `Moving todo ${todoId} from ${fromColumnId} to ${toColumnId}`
      );

      if (!this.todos[fromColumnId]) {
        console.error(`Source column ${fromColumnId} not found`);
        return;
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

        this.$emit("update-todos", updatedTodos);
      } else {
        console.error(`Todo ${todoId} not found in column ${fromColumnId}`);
      }
    },

    reorderTodo(columnId, newTodos) {
      // Process each todo to ensure it has proper structure
      const cleanTodos = newTodos.map((todo) => {
        // Mark the source column for items coming from other columns
        if (todo.sourceColumn === undefined && todo._id !== undefined) {
          // Find the original column for this todo
          for (const [colId, todos] of Object.entries(this.todos)) {
            if (colId !== columnId && todos.some((t) => t.id === todo.id)) {
              todo.sourceColumn = colId;
              break;
            }
          }
        }
        return todo;
      });

      const updatedTodos = {
        ...this.todos,
        [columnId]: cleanTodos,
      };

      this.$emit("update-todos", updatedTodos);
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
}
</style>
