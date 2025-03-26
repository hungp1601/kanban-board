<template>
  <div class="column" :id="`${column.id}-column`">
    <div class="column-header">
      <h2 class="column-title">{{ column.name }}</h2>
    </div>

    <div class="column-content">
      <draggable
        :list="localTodos"
        group="todos"
        ghost-class="ghost"
        @change="onDragChange"
        item-key="id"
        :animation="200"
        :empty-insert-threshold="20"
        class="draggable-container"
      >
        <template #item="{ element }">
          <TodoItem
            :todo="element"
            :columnId="column.id"
            @edit="$emit('edit-todo', element)"
            @delete="$emit('delete-todo', element.id)"
            @update-checklist-item="
              (params) =>
                $emit(
                  'update-checklist-item',
                  element.id,
                  params.index,
                  params.isCompleted
                )
            "
            @set-source-column="setSourceColumn"
          />
        </template>
        <template #header>
          <div class="column-drop-zone-top" v-if="localTodos.length > 0"></div>
        </template>
        <template #footer>
          <div class="empty-column-placeholder" v-if="localTodos.length === 0">
            {{ $t("kanban.dropTasksHere") }}
          </div>
          <div class="column-drop-zone-bottom" v-else></div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import TodoItem from "./TodoItem.vue";

export default {
  name: "KanbanColumn",
  components: {
    draggable,
    TodoItem,
  },
  props: {
    column: {
      type: Object,
      required: true,
    },
    todos: {
      type: Array,
      required: true,
    },
  },
  emits: [
    "edit-column",
    "delete-column",
    "edit-todo",
    "delete-todo",
    "update-checklist-item",
    "move-todo",
    "reorder-todo",
  ],
  computed: {
    localTodos: {
      get() {
        return this.todos;
      },
      set(value) {
        this.$emit("reorder-todo", this.column.id, value);
      },
    },
  },
  methods: {
    onDragChange(evt) {
      // Skip if nothing was added or moved
      if (!evt.added && !evt.moved) {
        return;
      }

      // Handle movement between columns
      if (evt.added) {
        const todoId = evt.added.element.id;
        const fromColumnId = evt.added.element.sourceColumn || null;

        if (fromColumnId && fromColumnId !== this.column.id) {
          // Emit the move event with required information
          this.$emit("move-todo", fromColumnId, this.column.id, todoId);
        } else if (!fromColumnId) {
          // If no sourceColumn, this might be a new todo or one dragged from a column that wasn't tracked
          console.warn(
            `Todo ${todoId} has no source column, setting current column as source`
          );

          // Update the local todos array with the source information
          const updatedTodos = [...this.localTodos];
          const todoIndex = updatedTodos.findIndex((t) => t.id === todoId);

          if (todoIndex !== -1) {
            updatedTodos[todoIndex] = {
              ...updatedTodos[todoIndex],
              sourceColumn: this.column.id,
            };
            this.$emit("reorder-todo", this.column.id, updatedTodos);
          }
        }
      }

      // Handle manual reordering within the same column
      if (evt.moved) {
        // The change is already handled by the localTodos setter
      }
    },

    setSourceColumn(todoId, columnId) {
      // Find the todo and set the source column
      const todoIndex = this.localTodos.findIndex((todo) => todo.id === todoId);
      if (todoIndex !== -1) {
        // Skip if the source column is already set correctly
        if (this.localTodos[todoIndex].sourceColumn === columnId) {
          return;
        }

        // Create a new array to avoid direct mutation
        const updatedTodos = [...this.localTodos];
        // Create a new todo object with the source column
        updatedTodos[todoIndex] = {
          ...updatedTodos[todoIndex],
          sourceColumn: columnId,
        };
        // Emit the updated list
        this.$emit("reorder-todo", this.column.id, updatedTodos);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.task {
  &-ghost {
    opacity: 0.5;
    background-color: #e9ecef;
    border: 1px dashed #6c7ae0;
  }
}

.dragging {
  opacity: 0.8;
  background-color: #ffffff;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  transform: rotate(2deg);
  z-index: 1000;
}

.column {
  min-width: 300px;
  max-width: 300px;
  background-color: #f4f5f7;
  border-radius: 5px;
  padding: 10px;
  flex-shrink: 0;

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding: 5px;
    background-color: #e4e6ea;
    border-radius: 3px;
    cursor: default; // Changed from grab to default
  }

  &-actions {
    button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.9rem;
      padding: 2px 5px;
    }
  }

  &-content {
    min-height: 200px;
    display: flex;
    flex-direction: column;
  }

  &-drop-zone {
    &-top,
    &-bottom {
      height: 10px;
      margin: 5px 0;
      border-radius: 3px;
      transition: all 0.2s ease;

      &:hover {
        background-color: rgba(200, 235, 251, 0.5);
      }
    }
  }
}

.draggable-container {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
  border: 2px dashed #3498db;
}

.empty-column-placeholder {
  min-height: 150px;
  border: 2px dashed #ccc;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
  font-style: italic;
  background-color: rgba(200, 200, 200, 0.1);
  margin: 10px 0;
}
</style>
