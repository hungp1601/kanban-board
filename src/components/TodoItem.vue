<template>
  <div class="task" :data-id="todo.id" :data-column="columnId">
    <div class="task-header">
      <div class="task-title">{{ todo.title }}</div>
      <div class="task-actions">
        <button @click.stop="$emit('edit')" title="Edit">✏️</button>
        <button @click.stop="$emit('delete')" title="Delete">🗑️</button>
      </div>
    </div>

    <div
      class="task-checklist"
      v-if="todo.checklist && todo.checklist.length > 0"
    >
      <div
        class="checklist-item"
        v-for="(item, index) in todo.checklist"
        :key="index"
      >
        <input
          type="checkbox"
          :checked="item.completed"
          @change="updateChecklistItem(index, $event.target.checked)"
        />
        <span>{{ item.text }}</span>
      </div>
    </div>

    <div
      class="description"
      v-if="todo.description"
      v-html="todo.description"
    ></div>
  </div>
</template>

<script>
export default {
  name: "TodoItem",
  props: {
    todo: {
      type: Object,
      required: true,
    },
    columnId: {
      type: String,
      required: true,
    },
  },
  emits: ["edit", "delete", "update-checklist-item", "set-source-column"],
  mounted() {
    // Emit event to set the source column instead of mutating the prop directly
    if (this.todo && this.columnId) {
      this.$nextTick(() => {
        this.$emit("set-source-column", this.todo.id, this.columnId);
      });
    }
  },
  methods: {
    updateChecklistItem(index, isCompleted) {
      this.$emit("update-checklist-item", {
        index,
        isCompleted,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.task {
  background-color: white;
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  padding: 10px;
  margin-bottom: 10px;
  cursor: grab;
  transition: transform 0.1s, box-shadow 0.1s;
  user-select: none;

  &:active {
    cursor: grabbing;
    transform: scale(1.02);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
  }

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  &-title {
    font-weight: bold;
    flex-grow: 1;
  }

  &-actions {
    button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.9rem;
      padding: 2px;
    }
  }

  &-checklist {
    .checklist-item {
      display: flex;
      align-items: center;
      margin: 5px 0;
    }
  }
}

.description {
  margin-top: 8px;
  font-size: 0.9rem;
}
</style>
