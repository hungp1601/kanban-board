class StorageService {
  constructor() {
    this.STORAGE_KEY = "kanban-todos";
    this.COLUMNS_KEY = "kanban-columns";
    this.initializeColumns();
  }

  // Initialize default columns if not exist
  initializeColumns() {
    if (!localStorage.getItem(this.COLUMNS_KEY)) {
      const defaultColumns = [
        { id: "todo", name: "To Do", order: 0 },
        { id: "in-progress", name: "In Progress", order: 1 },
        { id: "done", name: "Done", order: 2 },
      ];
      localStorage.setItem(this.COLUMNS_KEY, JSON.stringify(defaultColumns));
    }
  }

  // Get all columns
  getColumns() {
    const columnsJson = localStorage.getItem(this.COLUMNS_KEY);
    const columns = JSON.parse(columnsJson);
    return columns.sort((a, b) => a.order - b.order);
  }

  // Save columns
  saveColumns(columns) {
    localStorage.setItem(this.COLUMNS_KEY, JSON.stringify(columns));
  }

  // Get all todos from localStorage
  getTodos() {
    const todosJson = localStorage.getItem(this.STORAGE_KEY);
    const defaultTodos = {};

    // Initialize todos with all columns
    this.getColumns().forEach((column) => {
      defaultTodos[column.id] = [];
    });

    return todosJson ? JSON.parse(todosJson) : defaultTodos;
  }

  // Save all todos to localStorage
  saveTodos(todos) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todos));
  }
}

export default StorageService;
