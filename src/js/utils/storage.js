/**
 * LifeSync - IndexedDB Storage
 * For larger data with better performance than localStorage
 */

const DB_NAME = 'LifeSync';
const DB_VERSION = 1;

export class Storage {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('events')) {
          db.createObjectStore('events', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('habits')) {
          db.createObjectStore('habits', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('archivedTasks')) {
          db.createObjectStore('archivedTasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('archivedEvents')) {
          db.createObjectStore('archivedEvents', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('archivedProjects')) {
          db.createObjectStore('archivedProjects', { keyPath: 'id' });
        }
      };
    });
  }

  async getAll(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getById(storeName, id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(storeName, item) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, item) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Helper methods
  async saveTask(task) {
    return this.update('tasks', task);
  }

  async saveTasks(tasks) {
    const tx = this.db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    tasks.forEach(task => store.put(task));
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
  }

  async getTasks() {
    return this.getAll('tasks');
  }

  async updateTask(id, updates) {
    const task = await this.getById('tasks', id);
    if (task) {
      return this.update('tasks', { ...task, ...updates });
    }
  }

  async deleteTask(id) {
    return this.delete('tasks', id);
  }

  // Events
  async saveEvent(event) {
    return this.update('events', event);
  }

  async getEvents() {
    return this.getAll('events');
  }

  async updateEvent(id, updates) {
    const event = await this.getById('events', id);
    if (event) {
      return this.update('events', { ...event, ...updates });
    }
  }

  async deleteEvent(id) {
    return this.delete('events', id);
  }

  // Projects
  async saveProject(project) {
    return this.update('projects', project);
  }

  async getProjects() {
    return this.getAll('projects');
  }

  async updateProject(id, updates) {
    const project = await this.getById('projects', id);
    if (project) {
      return this.update('projects', { ...project, ...updates });
    }
  }

  async deleteProject(id) {
    return this.delete('projects', id);
  }

  // Team Members
  async saveTeamMember(member) {
    return this.update('users', member);
  }

  async getTeamMembers() {
    return this.getAll('users');
  }

  async deleteTeamMember(id) {
    return this.delete('users', id);
  }

  // Notes
  async saveNote(note) {
    return this.update('notes', note);
  }

  async getNotes() {
    return this.getAll('notes');
  }

  async deleteNote(id) {
    return this.delete('notes', id);
  }

  // Habits
  async saveHabit(habit) {
    return this.update('habits', habit);
  }

  async getHabits() {
    return this.getAll('habits');
  }

  async deleteHabit(id) {
    return this.delete('habits', id);
  }
}

export const storage = new Storage();
export default storage;
