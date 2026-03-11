/**
 * LifeSync - State Store
 * Reactive state management
 */

export class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Set();
    this.history = [];
    this.maxHistory = 50;
  }

  getState() {
    return this.state;
  }

  setState(newState, action = '') {
    const previousState = { ...this.state };
    
    this.state = {
      ...this.state,
      ...newState
    };

    // History for undo/redo
    if (action) {
      this.history.push({ action, previous: previousState, current: this.state });
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }

    // Notify all listeners
    this.listeners.forEach(fn => {
      try {
        fn(this.state, previousState, action);
      } catch (error) {
        console.error('Store listener error:', error);
      }
    });
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn); // Unsubscribe
  }

  dispatch(action, payload) {
    switch (action) {
      case 'SET_USER':
        this.setState({ user: payload }, 'login');
        break;
      case 'LOGOUT':
        this.setState({ user: null, isLoggedIn: false }, 'logout');
        break;
      case 'DARK_MODE':
        this.setState({ darkMode: payload }, 'theme');
        break;
      case 'SET_TAB':
        this.setState({ currentTab: payload }, 'navigation');
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  undo() {
    if (this.history.length > 1) {
      const lastState = this.history.pop();
      const previousState = this.history[this.history.length - 1]?.previous || {};
      this.state = previousState;
      this.listeners.forEach(fn => fn(this.state, lastState.previous, 'undo'));
    }
  }

  async loadFromSupabase(userId) {
    try {
      const { fetchTasks, fetchEvents, fetchProjects } = await import('./supabase.js');

      const [tasks, events, projects] = await Promise.all([
        fetchTasks(userId),
        fetchEvents(userId),
        fetchProjects(userId)
      ]);

      this.setState({
        tasks: tasks || [],
        events: events || [],
        projects: projects || [],
        teamMembers: [],
        archivedTasks: [],
        archivedEvents: [],
        archivedProjects: []
      }, 'load');
    } catch (error) {
      console.error('Failed to load data from Supabase:', error);
      // Set empty state so the UI still renders
      this.setState({
        tasks: [],
        events: [],
        projects: [],
        teamMembers: [],
        archivedTasks: [],
        archivedEvents: [],
        archivedProjects: []
      }, 'load-fallback');
    }
  }

  // Keep legacy method for backwards compatibility during transition
  async loadFromStorage(storage) {
    try {
      const [tasks, events, projects] = await Promise.all([
        storage.getTasks(),
        storage.getEvents(),
        storage.getProjects()
      ]);
      this.setState({
        tasks: tasks || [],
        events: events || [],
        projects: projects || [],
        teamMembers: [],
        archivedTasks: [],
        archivedEvents: [],
        archivedProjects: []
      }, 'load');
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  }

  // ═══════════════════════════════════════════
  //  REALTIME SYNC
  // ═══════════════════════════════════════════

  async initRealtime(userId) {
    try {
      const { subscribeToTasks } = await import('./supabase.js');
      
      subscribeToTasks(userId, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        const currentTasks = [...this.state.tasks];
        
        if (eventType === 'INSERT') {
          // Add new task if it doesn't already exist
          if (!currentTasks.some(t => t.id === newRecord.id)) {
            this.setState({ tasks: [newRecord, ...currentTasks] }, 'realtime-insert');
          }
        } else if (eventType === 'UPDATE') {
          // Update existing task
          const updatedTasks = currentTasks.map(t => 
            t.id === newRecord.id ? { ...t, ...newRecord } : t
          );
          this.setState({ tasks: updatedTasks }, 'realtime-update');
        } else if (eventType === 'DELETE') {
          // Remove deleted task
          const filteredTasks = currentTasks.filter(t => t.id !== oldRecord.id);
          this.setState({ tasks: filteredTasks }, 'realtime-delete');
        }
      });
    } catch (err) {
      console.error('Failed to init realtime sync:', err);
    }
  }

  async cleanupRealtime() {
    try {
      const { unsubscribeFromTasks } = await import('./supabase.js');
      unsubscribeFromTasks();
    } catch (err) {
      console.error('Failed to cleanup realtime sync:', err);
    }
  }

  clear() {
    this.state = {};
    this.history = [];
    this.cleanupRealtime();
  }
}

// Singleton instance
export const store = new Store({
  isLoggedIn: false,
  user: null,
  currentTab: 'today',
  currentWorkspaceView: 'projects',
  darkMode: false,
  sidebarCollapsed: false,
  tasks: [],
  events: [],
  projects: [],
  archivedTasks: [],
  archivedEvents: [],
  archivedProjects: [],
  teamMembers: [],
  activities: [],
  notifications: []
});

export default store;
