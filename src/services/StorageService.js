import { db, auth } from "../firebase/config";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

class StorageService {
  constructor() {
    this.COLUMNS_COLLECTION = "kanban-columns";
    this.TODOS_COLLECTION = "kanban-todos";
    this.cachedColumns = null;
  }

  // Get the current user ID or throw if no user is logged in
  getCurrentUserId() {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");
    return user.uid;
  }

  // Initialize default columns if not exist
  async initializeColumns() {
    try {
      const userId = this.getCurrentUserId();
      const userColumnsRef = doc(db, this.COLUMNS_COLLECTION, userId);
      const userColumnsSnap = await getDoc(userColumnsRef);

      if (!userColumnsSnap.exists()) {
        const defaultColumns = [
          { id: "new", name: "New", order: 0 },
          { id: "todo", name: "To Do", order: 1 },
          { id: "done", name: "Done", order: 2 },
        ];

        // Add a timestamp for better debugging and tracking
        await setDoc(userColumnsRef, {
          columns: defaultColumns,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        this.cachedColumns = defaultColumns;
        return defaultColumns;
      }

      const columns = userColumnsSnap.data().columns;
      this.cachedColumns = columns;
      return columns;
    } catch (error) {
      console.error("Error initializing columns:", error);
      throw error;
    }
  }

  // Get all columns
  async getColumns() {
    try {
      // Return cached columns if available to reduce Firebase reads
      if (this.cachedColumns) {
        return [...this.cachedColumns].sort((a, b) => a.order - b.order);
      }

      const userId = this.getCurrentUserId();
      const userColumnsRef = doc(db, this.COLUMNS_COLLECTION, userId);
      const userColumnsSnap = await getDoc(userColumnsRef);

      if (!userColumnsSnap.exists()) {
        return await this.initializeColumns();
      }

      const columns = userColumnsSnap.data().columns;
      this.cachedColumns = columns;
      return [...columns].sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error("Error getting columns:", error);
      throw error;
    }
  }

  // Save columns
  async saveColumns(columns) {
    try {
      const userId = this.getCurrentUserId();
      const userColumnsRef = doc(db, this.COLUMNS_COLLECTION, userId);

      // Update with timestamp
      await setDoc(
        userColumnsRef,
        {
          columns,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Update cache
      this.cachedColumns = columns;
      return true;
    } catch (error) {
      console.error("Error saving columns:", error);
      throw error;
    }
  }

  // Get all todos
  async getTodos() {
    try {
      const userId = this.getCurrentUserId();
      const userTodosRef = doc(db, this.TODOS_COLLECTION, userId);
      const userTodosSnap = await getDoc(userTodosRef);

      // Get all columns to initialize the todos structure
      const columns = await this.getColumns();
      const defaultTodos = {};
      columns.forEach((column) => {
        defaultTodos[column.id] = [];
      });

      if (!userTodosSnap.exists()) {
        // Initialize todos document for this user with timestamps
        await setDoc(userTodosRef, {
          todos: defaultTodos,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return defaultTodos;
      }

      const todos = userTodosSnap.data().todos;

      // Ensure the todos object has entries for all columns
      columns.forEach((column) => {
        if (!todos[column.id]) {
          todos[column.id] = [];
        }
      });

      return todos;
    } catch (error) {
      console.error("Error getting todos:", error);
      throw error;
    }
  }

  // Save all todos
  async saveTodos(todos) {
    try {
      const userId = this.getCurrentUserId();
      const userTodosRef = doc(db, this.TODOS_COLLECTION, userId);

      // Update with timestamp
      await setDoc(
        userTodosRef,
        {
          todos,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return true;
    } catch (error) {
      console.error("Error saving todos:", error);
      throw error;
    }
  }
}

export default StorageService;
