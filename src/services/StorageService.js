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
    this.cachedTodos = null; // Add caching for todos
    this.cacheExpiration = 60000; // Cache valid for 1 minute
    this.lastCacheTime = 0;
  }

  // Get the current user ID or throw if no user is logged in
  getCurrentUserId() {
    const user = auth.currentUser;
    // Also check the session service as a fallback
    if (!user) {
      const sessionUser = JSON.parse(
        localStorage.getItem("kanban-auth-session")
      );
      if (sessionUser && sessionUser.uid) {
        return sessionUser.uid;
      }
      throw new Error("No authenticated user");
    }
    return user.uid;
  }

  // Check if cache is still valid
  isCacheValid() {
    return Date.now() - this.lastCacheTime < this.cacheExpiration;
  }

  // Initialize default columns if not exist
  async initializeColumns() {
    try {
      const userId = this.getCurrentUserId();
      const userColumnsRef = doc(db, this.COLUMNS_COLLECTION, userId);

      // Add timeout to Firebase operations
      const docPromise = getDoc(userColumnsRef);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Firebase operation timed out")),
          3000
        )
      );

      const userColumnsSnap = await Promise.race([docPromise, timeoutPromise]);

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
        this.lastCacheTime = Date.now();
        return defaultColumns;
      }

      const columns = userColumnsSnap.data().columns;
      this.cachedColumns = columns;
      this.lastCacheTime = Date.now();
      return columns;
    } catch (error) {
      console.error("Error initializing columns:", error);
      // Return default columns as a fallback if Firebase fails
      const defaultColumns = [
        { id: "new", name: "New", order: 0 },
        { id: "todo", name: "To Do", order: 1 },
        { id: "done", name: "Done", order: 2 },
      ];
      return defaultColumns;
    }
  }

  // Get all columns
  async getColumns() {
    try {
      // Return cached columns if available and still valid to reduce Firebase reads
      if (this.cachedColumns && this.isCacheValid()) {
        return [...this.cachedColumns].sort((a, b) => a.order - b.order);
      }

      const userId = this.getCurrentUserId();
      const userColumnsRef = doc(db, this.COLUMNS_COLLECTION, userId);

      // Add timeout to Firebase operations
      const docPromise = getDoc(userColumnsRef);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Firebase operation timed out")),
          3000
        )
      );

      const userColumnsSnap = await Promise.race([docPromise, timeoutPromise]);

      if (!userColumnsSnap.exists()) {
        return await this.initializeColumns();
      }

      const columns = userColumnsSnap.data().columns;
      this.cachedColumns = columns;
      this.lastCacheTime = Date.now();
      return [...columns].sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error("Error getting columns:", error);
      // If we have cached columns, return them as fallback even if expired
      if (this.cachedColumns) {
        return [...this.cachedColumns].sort((a, b) => a.order - b.order);
      }
      // Otherwise try to initialize with defaults
      return this.initializeColumns();
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
      this.lastCacheTime = Date.now();
      return true;
    } catch (error) {
      console.error("Error saving columns:", error);
      throw error;
    }
  }

  // Get all todos
  async getTodos() {
    try {
      // Return cached todos if available and still valid
      if (this.cachedTodos && this.isCacheValid()) {
        return { ...this.cachedTodos };
      }

      const userId = this.getCurrentUserId();
      const userTodosRef = doc(db, this.TODOS_COLLECTION, userId);

      // Add timeout to Firebase operations
      const docPromise = getDoc(userTodosRef);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Firebase operation timed out")),
          3000
        )
      );

      const userTodosSnap = await Promise.race([docPromise, timeoutPromise]);

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
        this.cachedTodos = defaultTodos;
        this.lastCacheTime = Date.now();
        return defaultTodos;
      }

      const todos = userTodosSnap.data().todos;

      // Ensure the todos object has entries for all columns
      columns.forEach((column) => {
        if (!todos[column.id]) {
          todos[column.id] = [];
        }
      });

      this.cachedTodos = todos;
      this.lastCacheTime = Date.now();
      return todos;
    } catch (error) {
      console.error("Error getting todos:", error);

      // If we have cached todos, use them as fallback even if expired
      if (this.cachedTodos) {
        return { ...this.cachedTodos };
      }

      // Otherwise create empty structure based on columns
      const columns = await this.getColumns();
      const defaultTodos = {};
      columns.forEach((column) => {
        defaultTodos[column.id] = [];
      });
      return defaultTodos;
    }
  }

  // Save all todos
  async saveTodos(todos) {
    try {
      const userId = this.getCurrentUserId();
      const userTodosRef = doc(db, this.TODOS_COLLECTION, userId);

      // Update cache immediately for instant UI feedback
      this.cachedTodos = todos;
      this.lastCacheTime = Date.now();

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
