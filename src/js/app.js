/**
 * LifeSync - Main Application Entry
 * Modular architecture with Vite
 */

import { store } from './utils/store.js';
import { storage } from './utils/storage.js';
import { ErrorHandler } from './utils/errorHandler.js';
import { onesignal } from './utils/onesignal.js';
import {
  searchProfiles, addFriend,
  signIn, signUp, signOut, getSession, onAuthStateChange,
  createTask as supabaseCreateTask, updateTask as supabaseUpdateTask,
  createEvent as supabaseCreateEvent,
  createProject as supabaseCreateProject
} from './utils/supabase.js';

// Import renderers
import { renderToday } from './render/today.js';
import { renderCalendar } from './render/calendar.js';
import { renderWorkspace } from './render/workspace.js';
import { renderNetwork } from './render/network.js';
import { renderArchive } from './render/archive.js';

// Initialize Error Handler
ErrorHandler.init();

// DOM Utilities
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Expose to global scope
window.$ = $;
window.$$ = $$;

// Global App State
const AppState = {
  isLoggedIn: false,
  currentUser: null,
  currentTab: 'today',
  darkMode: false,
  sidebarOpen: false
};
window.AppState = AppState;

/**
 * Hide the splash screen and reveal the app container.
 */
function hideSplash() {
  const splash = document.getElementById('app-splash');
  const app = document.getElementById('app');

  if (app) app.style.display = 'block';

  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
      splash.remove();
    }, 400); // matches CSS transition duration
  }
}

/**
 * Initialize Application
 */
async function init() {
  // Safety net: force-hide splash after 5 seconds no matter what
  const splashTimeout = setTimeout(() => {
    console.warn('Splash safety timeout triggered.');
    hideSplash();
  }, 5000);

  try {
    // Check Supabase auth session
    const session = await getSession();

    if (session?.user) {
      // User is authenticated — build AppState from session
      const user = session.user;
      AppState.currentUser = {
        id: user.id,
        name: user.user_metadata?.name || user.email.split('@')[0],
        email: user.email,
        role: 'Kullanıcı',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
        status: 'online'
      };
      AppState.isLoggedIn = true;

      // Load real data from Supabase
      await store.loadFromSupabase(user.id);
      // Initialize Realtime Sync
      await store.initRealtime(user.id);
      
      showMainApp();
    } else {
      showAuthScreen();
    }

    // Listen for auth state changes (login, logout, token refresh)
    onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        AppState.currentUser = null;
        AppState.isLoggedIn = false;
        store.cleanupRealtime();
        onesignal.logout();
        showAuthScreen();
      }
    });

    // Subscribe to store state changes
    store.subscribe((state) => {
      if (state.isLoggedIn !== undefined) {
        AppState.isLoggedIn = state.isLoggedIn;
      }
    });

  } catch (error) {
    ErrorHandler.handle(error, 'App Initialization');
    // Fallback: show auth screen on error
    showAuthScreen();
  } finally {
    clearTimeout(splashTimeout);
    hideSplash();
  }
}

/**
 * Show Auth Screen
 */
function showAuthScreen() {
  $('#auth-screen').style.display = 'flex';
  $('#main-app').style.display = 'none';
  initAuth();
}

/**
 * Show Main App
 */
function showMainApp() {
  $('#auth-screen').style.display = 'none';
  $('#main-app').style.display = 'block';

  // Update user info
  if (AppState.currentUser) {
    const avatar = $('#nav-user-avatar');
    const name = $('#nav-user-name');
    const role = $('#nav-user-role');

    if (avatar) avatar.src = AppState.currentUser.avatar;
    if (name) name.textContent = AppState.currentUser.name;
    if (role) role.textContent = AppState.currentUser.role || 'Kullanıcı';
  }

  // Initialize modules
  onesignal.init();
  initNavigation();
  initSidebar();
  initModals();
  initEventListeners();

  // Initial render
  renderToday();
}

/**
 * Initialize Sidebar Toggle (Mobile Open/Close)
 */
function initSidebar() {
  const sidebar = $('#sidebar');
  const sidebarToggle = $('#sidebar-toggle');
  const menuToggle = $('#menu-toggle');

  // Close button inside sidebar (the "<" icon)
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.remove('open');
      AppState.sidebarOpen = false;
    });
  }

  // Hamburger menu button on the header (opens sidebar on mobile)
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      AppState.sidebarOpen = sidebar.classList.contains('open');
    });
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (!sidebar || !AppState.sidebarOpen) return;
    if (window.innerWidth > 1024) return;
    if (!sidebar.contains(e.target) && !menuToggle?.contains(e.target)) {
      sidebar.classList.remove('open');
      AppState.sidebarOpen = false;
    }
  });

  // Logout button
  const logoutBtn = $('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut();
        // onAuthStateChange handler will take care of cleanup and showing auth screen
      } catch (err) {
        console.error('Logout error:', err);
        window.showToast('Çıkış yapılamadı: ' + err.message);
      }
    });
  }
}

/**
 * Initialize Navigation with Event Delegation
 */
function initNavigation() {
  // Event delegation for nav items
  const sidebar = $('#sidebar');
  const bottomNav = $('#bottom-nav');

  // Sidebar navigation
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (navItem) {
        e.preventDefault();
        const tab = navItem.dataset.tab;
        if (tab) {
          switchTab(tab);

          // Close sidebar on mobile
          if (window.innerWidth <= 1024) {
            sidebar.classList.remove('open');
            AppState.sidebarOpen = false;
          }
        }
      }
    });
  }

  // Bottom nav (mobile)
  if (bottomNav) {
    bottomNav.addEventListener('click', (e) => {
      const navItem = e.target.closest('.bottom-nav-item');
      if (navItem) {
        e.preventDefault();
        const tab = navItem.dataset.tab;
        if (tab) {
          switchTab(tab);
        }
      }
    });
  }

  // Dark Mode Toggle initialization
  initDarkModeToggle();
}

/**
 * Initialize Dark Mode Toggle
 */
function initDarkModeToggle() {
  const headerRight = $('.header-right');
  if (headerRight && !$('#dark-mode-toggle')) {
    const btn = document.createElement('button');
    btn.id = 'dark-mode-toggle';
    btn.className = 'notification-btn';
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
    headerRight.insertBefore(btn, headerRight.firstChild);

    btn.addEventListener('click', () => {
      AppState.darkMode = !AppState.darkMode;
      store.dispatch('DARK_MODE', AppState.darkMode);
      if (AppState.darkMode) {
        document.body.classList.add('light-mode');
        window.showToast('Karanlık mod kapandı');
      } else {
        document.body.classList.remove('light-mode');
        window.showToast('Karanlık mod açıldı');
      }
    });

    // Initial state check from store
    const state = store.getState();
    if (state.darkMode) {
      AppState.darkMode = true;
      document.body.classList.add('light-mode');
    }
  }
}

/**
 * Switch Tab
 */
function switchTab(tab) {
  if (!tab || tab === AppState.currentTab) return;

  AppState.currentTab = tab;
  store.dispatch('SET_TAB', tab);

  // Update active states
  $$('.nav-item, .bottom-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tab);
  });

  // Show/hide content
  $$('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tab}`);
  });

  // Update page title
  const titles = {
    today: 'Bugün',
    calendar: 'Takvim',
    workspace: 'İş İstasyonu',
    network: 'Ağım',
    archive: 'Arşiv'
  };

  const pageTitle = $('#page-title');
  if (pageTitle) {
    pageTitle.textContent = titles[tab] || 'LifeSync';
  }

  // Render tab content
  switch (tab) {
    case 'today':
      renderToday();
      break;
    case 'calendar':
      renderCalendar();
      break;
    case 'workspace':
      renderWorkspace();
      break;
    case 'network':
      renderNetwork(AppState.currentUser?.id);
      break;
    case 'archive':
      renderArchive();
      break;
  }
}


/**
 * Initialize Modals with Event Delegation
 */
function initModals() {
  // Event delegation for modal close buttons
  document.addEventListener('click', (e) => {
    // Close button clicked
    if (e.target.matches('[data-close-modal]') || e.target.closest('[data-close-modal]')) {
      e.preventDefault();
      closeModal();
      return;
    }

    // Modal overlay clicked
    if (e.target.matches('.modal-overlay')) {
      e.preventDefault();
      closeModal();
      return;
    }
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

/**
 * Initialize Event Listeners
 */
function initEventListeners() {
  // FAB button
  const fab = $('#fab-new-task');
  if (fab) {
    fab.addEventListener('click', () => {
      openTaskModal();
    });
  }

  // Quick add form
  const quickAddForm = $('#quick-add-form');
  if (quickAddForm) {
    quickAddForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = $('#quick-task-input');
      const priority = $('#quick-priority');

      if (input && input.value.trim()) {
        const task = {
          id: Date.now().toString(),
          title: input.value.trim(),
          priority: priority?.value || 'medium',
          status: 'todo',
          completed: false,
          createdAt: new Date().toISOString()
        };

        await storage.saveTask(task);
        store.setState({ tasks: [...store.getState().tasks, task] }, 'add-task');

        input.value = '';
        window.showToast('Görev eklendi!');

        // Refresh the today view
        if (AppState.currentTab === 'today') {
          renderToday();
        }
      }
    });
  }

  // Workspace tabs
  initWorkspaceTabs();

  // Modal form submissions
  initModalForms();

  // Mini Calendar initialization
  initMiniCalendar();

  // Notification button
  const notificationBtn = $('#notification-btn');
  const notificationPanel = $('#notification-panel');

  if (notificationBtn && notificationPanel) {
    notificationBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationPanel.classList.toggle('active');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!notificationPanel.contains(e.target) && e.target !== notificationBtn) {
        notificationPanel.classList.remove('active');
      }
    });
  }

  // User profile button acts as Logout
  const userProfileBtn = $('#user-profile-btn');
  if (userProfileBtn) {
    userProfileBtn.addEventListener('click', () => {
      if (confirm('Hesabınızdan çıkış yapmak istediğinize emin misiniz?')) {
        logout();
      }
    });
  }

  // Project button
  const addProjectBtn = $('#add-project-btn');
  if (addProjectBtn) {
    addProjectBtn.addEventListener('click', () => {
      openProjectModal();
    });
  }

  // Add event button
  const addEventBtn = $('#add-event-btn');
  if (addEventBtn) {
    addEventBtn.addEventListener('click', () => {
      openEventModal();
    });
  }

  // Invite member button
  const inviteMemberBtn = $('#invite-member-btn');
  if (inviteMemberBtn) {
    inviteMemberBtn.addEventListener('click', () => {
      openInviteModal();
    });
  }

  // Invite search functionality
  const inviteSearch = $('#invite-search');
  if (inviteSearch) {
    inviteSearch.addEventListener('input', async (e) => {
      const query = e.target.value.trim();
      const resultsContainer = $('#invite-search-results');
      if (!resultsContainer) return;

      if (query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
      }

      const profiles = await searchProfiles(query);
      if (profiles.length === 0) {
        resultsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">Kullanıcı bulunamadı.</p>';
        return;
      }

      resultsContainer.innerHTML = profiles.map(p => `
        <div class="user-result" style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${p.avatar}" alt="${p.name}" style="width: 32px; height: 32px; border-radius: 50%;">
            <div>
              <div style="font-weight: 500; font-size: 0.875rem; color: var(--text-primary);">${p.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${p.email}</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm add-friend-btn" data-id="${p.id}">Ekle</button>
        </div>
      `).join('');

      // Bind Add friend buttons
      resultsContainer.querySelectorAll('.add-friend-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const friendId = btn.dataset.id;
          const currentUserId = AppState.currentUser?.id || '11111111-1111-1111-1111-111111111111'; // Match Demo user UUID
          await addFriend(currentUserId, friendId);
          btn.textContent = 'İstek Gönderildi';
          btn.disabled = true;
          window.showToast('Arkadaşlık isteği gönderildi!');
        });
      });
    });
  }

  // Profile modal functions
  initProfileModal();
}

/**
 * Initialize Workspace Tabs
 */
function initWorkspaceTabs() {
  const workspaceTabs = $$('.workspace-tab');
  workspaceTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.workspace;

      workspaceTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      $$('.workspace-view').forEach(v => {
        v.classList.remove('active');
        if (v.id === `view-${view}`) {
          v.classList.add('active');
        }
      });
    });
  });
}

/**
 * Initialize Modal Forms
 */
function initModalForms() {
  // Task form
  const taskForm = $('#task-form');
  if (taskForm) {
    taskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = $('#task-title').value;
      const description = $('#task-description').value;
      const priority = $('#task-priority').value;
      const status = $('#task-status').value;

      const modal = $('#task-modal');
      const editTaskId = modal.dataset.editTaskId;
      const userId = AppState.currentUser?.id;

      try {
        // Handle Attachments Upload
        const fileInput = $('#task-attachment');
        let attachments = [];
        const { uploadFile } = await import('./utils/supabase.js');

        if (fileInput && fileInput.files.length > 0) {
          const uploadBtn = $('#task-form').querySelector('button[type="submit"]');
          const origText = uploadBtn.innerHTML;
          uploadBtn.innerHTML = 'Dosyalar Yükleniyor...';
          uploadBtn.disabled = true;

          for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `task-${Date.now()}-${i}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;
            const publicUrl = await uploadFile('attachments', filePath, file);
            attachments.push({ name: file.name, url: publicUrl, type: file.type });
          }

          uploadBtn.innerHTML = origText;
          uploadBtn.disabled = false;
        }

        if (editTaskId) {
          // Update existing task in Supabase
          // If editing, we append new attachments to existing ones or just replace (simplification: replace/add new)
          // For a true system we'd merge, but for this step we will just set the new ones if any were uploaded
          const updatePayload = { title, description, priority, status };
          if (attachments.length > 0) {
             const existState = store.getState().tasks.find(t => t.id === editTaskId);
             updatePayload.attachments = [...(existState?.attachments || []), ...attachments];
          }

          const updated = await supabaseUpdateTask(editTaskId, updatePayload);
          const state = store.getState();
          const tasks = state.tasks.map(t =>
            t.id === editTaskId ? { ...t, ...updated } : t
          );
          store.setState({ tasks }, 'update-task');
          window.showToast('Görev güncellendi!');
        } else {
          // Create new task in Supabase
          const newTask = await supabaseCreateTask({
            user_id: userId,
            title,
            description,
            priority,
            status,
            attachments
          });

          store.setState({ tasks: [newTask, ...store.getState().tasks] }, 'add-task');
          window.showToast('Görev oluşturuldu!');

          const isPublic = $('#task-is-public')?.checked;
          if (isPublic) {
            onesignal.sendNotification(`Yeni Görev: ${title}`, description, false, [userId]);
          }
        }
      } catch (err) {
        console.error('Task save error:', err);
        window.showToast('Görev kaydedilemedi: ' + (err.message || 'Bilinmeyen hata'));
        const uploadBtn = $('#task-form').querySelector('button[type="submit"]');
        if(uploadBtn) {
           uploadBtn.innerHTML = 'Kaydet';
           uploadBtn.disabled = false;
        }
      }

      closeModal();
      taskForm.reset();
      const taskFileDisplay = $('#task-file-name-display');
      if (taskFileDisplay) taskFileDisplay.textContent = 'Dosya seçmek için tıklayın';
      delete modal.dataset.editTaskId;

      if (AppState.currentTab === 'today' || AppState.currentTab === 'workspace') {
        if (typeof renderToday === 'function') renderToday();
        if (typeof renderWorkspace === 'function') renderWorkspace();
      }
    });

    // File Input UI Handler for Tasks
    const taskDropArea = $('#file-drop-area');
    const taskFileInput = $('#task-attachment');
    const taskFileNameDisplay = $('#task-file-name-display');

    if (taskDropArea && taskFileInput) {
      taskDropArea.addEventListener('click', () => taskFileInput.click());
      taskFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          const names = Array.from(e.target.files).map(f => f.name).join(', ');
          if (taskFileNameDisplay) taskFileNameDisplay.textContent = names;
        } else {
          if (taskFileNameDisplay) taskFileNameDisplay.textContent = 'Dosya seçmek için tıklayın';
        }
      });
    }
  }
}

/**
 * Open Modal
 */
function openModal(id) {
  const modal = $(`#${id}`);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close Modal
 */
function closeModal() {
  const activeModal = $('.modal.active');
  if (activeModal) {
    activeModal.classList.remove('active');
    document.body.style.overflow = '';

    // Reset all form inputs within the closing modal
    const forms = activeModal.querySelectorAll('form');
    forms.forEach(form => form.reset());

    // Clean up specific data attributes and state
    if (activeModal.id === 'task-modal') {
      const titleEl = $('#task-modal-title');
      if (titleEl) titleEl.textContent = 'Yeni Görev';
      delete activeModal.dataset.editTaskId;
    } else if (activeModal.id === 'event-modal') {
      const titleEl = $('#event-modal-title');
      if (titleEl) titleEl.textContent = 'Yeni Etkinlik';
      delete activeModal.dataset.editEventId;
    } else if (activeModal.id === 'project-modal') {
      const titleEl = $('#project-modal-title');
      if (titleEl) titleEl.textContent = 'Yeni Proje';
      delete activeModal.dataset.editProjectId;
    } else if (activeModal.id === 'invite-modal') {
      const searchInput = $('#invite-search');
      if (searchInput) searchInput.value = '';
      const resultsContainer = $('#invite-search-results');
      if (resultsContainer) resultsContainer.innerHTML = '';
    }
  }
}

/**
 * Open Task Modal
 */
function openTaskModal(taskId = null, status = 'todo') {
  const modal = $('#task-modal');
  if (modal) {
    const titleEl = $('#task-modal-title');
    if (titleEl) {
      titleEl.textContent = taskId ? 'Görev Düzenle' : 'Yeni Görev';
    }
    const form = $('#task-form');
    if (form) form.reset();

    if (status) {
      const statusSelect = $('#task-status');
      if (statusSelect) statusSelect.value = status;
    }

    if (taskId) {
      modal.dataset.editTaskId = taskId;
    } else {
      delete modal.dataset.editTaskId;
    }

    openModal('task-modal');
  }
}
window.openTaskModal = openTaskModal;

/**
 * Open Event Modal
 */
function openEventModal(eventId = null, defaultDate = null) {
  const modal = $('#event-modal');
  if (modal) {
    const titleEl = $('#event-modal-title');
    if (titleEl) {
      titleEl.textContent = eventId ? 'Etkinlik Düzenle' : 'Yeni Etkinlik';
    }
    const form = $('#event-form');
    if (form) form.reset();

    const startInput = $('#event-start');
    if (startInput) {
      if (defaultDate) {
        startInput.value = defaultDate + 'T12:00';
      } else if (!eventId) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        startInput.value = now.toISOString().slice(0, 16);
      }
    }

    if (eventId) {
      modal.dataset.editEventId = eventId;
    } else {
      delete modal.dataset.editEventId;
    }

    openModal('event-modal');
  }
}
window.openEventModal = openEventModal;

/**
 * Open Project Modal
 */
function openProjectModal(projectId = null) {
  const modal = $('#project-modal');
  const titleEl = $('#project-modal-title');

  if (modal) {
    if (titleEl) {
      titleEl.textContent = projectId ? 'Proje Düzenle' : 'Yeni Proje';
    }
    modal.dataset.editProjectId = projectId || '';
    openModal('project-modal');
  }
}

window.openProjectModal = openProjectModal;

/**
 * Open Invite Modal
 */
function openInviteModal() {
  const modal = $('#invite-modal');
  if (modal) {
    openModal('invite-modal');
  } else {
    // Fallback if modal UI is not added properly
    const inviteEmail = prompt('Davet etmek için e-posta adresi girin:');
    if (inviteEmail && inviteEmail.includes('@')) {
      window.showToast(`Davet e-postası gönderildi: ${inviteEmail}`);
    } else if (inviteEmail) {
      window.showError('Geçerli bir e-posta adresi girin');
    }
  }
}

window.openInviteModal = openInviteModal;

/**
 * Profile Modal Functions
 */
let selectedAvatar = null;

function initProfileModal() {
  const profileModal = $('#profile-modal');
  if (!profileModal) return;

  const avatarPreview = $('#profile-avatar-preview');
  const avatarOptions = $('#avatar-options');
  const saveProfileBtn = $('#save-profile-btn');

  // Avatar options - initially hidden
  const avatarSeeds = ['alex', 'bob', 'charlie', 'diana', 'emma', 'frank', 'grace', 'henry'];

  if (avatarOptions) {
    avatarOptions.style.display = 'none';

    avatarOptions.innerHTML = avatarSeeds.map(seed => `
      <div class="avatar-option" data-seed="${seed}">
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}" alt="${seed}">
      </div>
    `).join('');

    avatarOptions.querySelectorAll('.avatar-option').forEach(option => {
      option.addEventListener('click', () => {
        avatarOptions.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        selectedAvatar = option.dataset.seed;

        const preview = $('#profile-avatar-preview');
        if (preview) {
          preview.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAvatar}`;
        }
      });
    });
  }

  // Click on avatar preview to change avatar
  if (avatarPreview) {
    avatarPreview.style.cursor = 'pointer';
    avatarPreview.addEventListener('click', () => {
      if (avatarOptions) {
        avatarOptions.style.display = avatarOptions.style.display === 'none' ? 'flex' : 'none';
      }
    });
  }

  // Also allow clicking on the preview container
  const previewContainer = $('.profile-avatar-preview');
  const uploadBtn = $('#avatar-upload-btn');
  const fileInput = $('#profile-avatar-upload');

  const openAvatarPicker = () => {
    if (avatarOptions) {
      avatarOptions.style.display = avatarOptions.style.display === 'none' ? 'flex' : 'none';
    }
  };

  if (previewContainer) {
    previewContainer.style.cursor = 'pointer';
    previewContainer.addEventListener('click', openAvatarPicker);
  }

  // Handle actual file upload
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const user = AppState.currentUser;
      if (!user) return;

      try {
        const uploadBtnEl = $('#avatar-upload-btn');
        const originalText = uploadBtnEl.innerHTML;
        uploadBtnEl.innerHTML = '<span class="loader" style="width: 14px; height: 14px; border-width: 2px; margin-right: 4px;"></span> Yükleniyor...';
        uploadBtnEl.disabled = true;

        // Upload to bucket 'avatars'
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        // Use full JS import context since updateProfileAvatar is exported
        const { uploadFile, updateProfileAvatar } = await import('./utils/supabase.js');
        const publicUrl = await uploadFile('avatars', filePath, file);
        
        // Immedately update profile in Supabase
        await updateProfileAvatar(user.id, publicUrl);
        
        // Update local object & UI
        selectedAvatar = null; // Clear dicebear seed
        const preview = $('#profile-avatar-preview');
        if (preview) {
          preview.src = publicUrl;
        }

        // Apply updated user state context
        const updatedUser = { ...AppState.currentUser, avatar: publicUrl };
        localStorage.setItem('lifesync_user', JSON.stringify(updatedUser));
        AppState.currentUser = updatedUser;
        
        // Update Navbar Avatar
        const navAvatar = $('#nav-user-avatar');
        if (navAvatar) navAvatar.src = publicUrl;

        window.showToast('Profil fotoğrafınız başarıyla güncellendi.');
        
        uploadBtnEl.innerHTML = originalText;
        uploadBtnEl.disabled = false;
        
        if (avatarOptions) avatarOptions.style.display = 'none';

      } catch (err) {
        console.error('Avatar upload failed:', err);
        window.showToast('Fotoğraf yüklenemedi: ' + err.message);
        const uploadBtnEl = $('#avatar-upload-btn');
        uploadBtnEl.innerHTML = 'Fotoğraf Yükle';
        uploadBtnEl.disabled = false;
      }
    });
  }

  // Load current user data
  loadProfileData();

  // Save profile
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
      saveProfile();
    });
  }
}

function loadProfileData() {
  const user = AppState.currentUser;
  if (!user) return;

  const nameInput = $('#profile-name');
  const roleInput = $('#profile-role');
  const avatarPreview = $('#profile-avatar-preview');

  if (nameInput) nameInput.value = user.name || '';
  if (roleInput) roleInput.value = user.role || '';
  if (avatarPreview && user.avatar) {
    avatarPreview.src = user.avatar;
    // Extract seed from avatar URL if it's from dicebear
    if (user.avatar.includes('dicebear')) {
      const match = user.avatar.match(/seed=([^&]+)/);
      if (match) selectedAvatar = match[1];
    } else {
      selectedAvatar = null;
    }
  }
}

function saveProfile() {
  const nameInput = $('#profile-name');
  const roleInput = $('#profile-role');
  const avatarPreview = $('#profile-avatar-preview');

  const name = nameInput?.value?.trim();
  const role = roleInput?.value?.trim();

  let avatar = AppState.currentUser?.avatar;
  if (selectedAvatar) {
    avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAvatar}`;
  }

  const updatedUser = {
    ...AppState.currentUser,
    name: name || AppState.currentUser.name,
    role: role || AppState.currentUser.role,
    avatar: avatar
  };

  localStorage.setItem('lifesync_user', JSON.stringify(updatedUser));
  AppState.currentUser = updatedUser;

  // Update UI
  const navAvatar = $('#nav-user-avatar');
  const navName = $('#nav-user-name');
  const navRole = $('#nav-user-role');

  if (navAvatar) navAvatar.src = avatar;
  if (navName) navName.textContent = updatedUser.name;
  if (navRole) navRole.textContent = updatedUser.role;

  closeModal();
  window.showToast('Profil güncellendi!');
}

function openProfileModal() {
  selectedAvatar = null;
  loadProfileData();
  openModal('profile-modal');
}

window.openProfileModal = openProfileModal;

/**
 * Initialize Auth
 */
function initAuth() {
  const loginForm = $('#login-form');
  const registerForm = $('#register-form');
  const authTabs = $$('.auth-tab');

  // Tab switching
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.auth;

      authTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      $$('.auth-form').forEach(form => {
        form.classList.toggle('active', form.id === `${target}-form`);
      });
    });
  });

  // Login form — Supabase Auth
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('#login-email').value.trim();
      const password = $('#login-password').value;

      if (!email || !password) {
        window.showToast('Lütfen e-posta ve şifrenizi girin.');
        return;
      }

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Giriş yapılıyor...'; }

      try {
        const data = await signIn(email, password);
        const user = data.user;

        AppState.currentUser = {
          id: user.id,
          name: user.user_metadata?.name || user.email.split('@')[0],
          email: user.email,
          role: 'Kullanıcı',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
          status: 'online'
        };
        AppState.isLoggedIn = true;

        await store.loadFromSupabase(user.id);
        showMainApp();
        window.showToast(`Hoş geldiniz, ${AppState.currentUser.name}!`);
      } catch (err) {
        console.error('Login error:', err);
        const msg = err.message?.includes('Invalid login')
          ? 'E-posta veya şifre hatalı.'
          : (err.message || 'Giriş başarısız. Lütfen tekrar deneyin.');
        window.showToast(msg);
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Giriş Yap'; }
      }
    });
  }

  // Register form — Supabase Auth
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#register-name').value.trim();
      const email = $('#register-email').value.trim();
      const password = $('#register-password').value;

      if (!name || !email || !password) {
        window.showToast('Lütfen tüm alanları doldurun.');
        return;
      }

      if (password.length < 6) {
        window.showToast('Şifre en az 6 karakter olmalıdır.');
        return;
      }

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Hesap oluşturuluyor...'; }

      try {
        const data = await signUp(email, password, name);

        if (data.session) {
          const user = data.user;
          AppState.currentUser = {
            id: user.id,
            name: name,
            email: user.email,
            role: 'Kullanıcı',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
            status: 'online'
          };
          AppState.isLoggedIn = true;

          await store.loadFromSupabase(user.id);
          showMainApp();
          window.showToast(`Hesabınız oluşturuldu. Hoş geldiniz, ${name}!`);
        } else {
          window.showToast('Hesabınız oluşturuldu! Lütfen e-posta adresinizi doğrulayın.');
        }
      } catch (err) {
        console.error('Register error:', err);
        const msg = err.message?.includes('already registered')
          ? 'Bu e-posta adresi zaten kayıtlı.'
          : (err.message || 'Kayıt başarısız. Lütfen tekrar deneyin.');
        window.showToast(msg);
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Hesap Oluştur'; }
      }
    });
  }
}

/**
 * Logout — Supabase Auth
 */
async function logout() {
  try {
    await signOut();
  } catch (err) {
    console.error('Logout error:', err);
  }
  AppState.currentUser = null;
  AppState.isLoggedIn = false;
  showAuthScreen();
}

/**
 * Initialize Mini Calendar
 */
function initMiniCalendar() {
  const miniCalendar = $('#mini-calendar');
  if (!miniCalendar) return;

  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  let miniCalendarDate = new Date();

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  function isSameDay(d1, d2) {
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  }

  function renderMiniCalendar() {
    const monthEl = $('#mini-calendar-month');
    if (!monthEl) return;

    const year = miniCalendarDate.getFullYear();
    const month = miniCalendarDate.getMonth();

    monthEl.textContent = `${MONTHS[month]} ${year}`;

    const weekdays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    let days = weekdays.map(d => `<div class="mini-calendar-day header">${d}</div>`);

    // Previous month days
    for (let i = getFirstDayOfMonth(year, month) - 1; i >= 0; i--) {
      const day = getDaysInMonth(year, month - 1) - i;
      days.push(`<div class="mini-calendar-day other-month">${day}</div>`);
    }

    // Current month days
    for (let i = 1; i <= getDaysInMonth(year, month); i++) {
      const date = new Date(year, month, i);
      const isToday = isSameDay(date, new Date());
      days.push(`<div class="mini-calendar-day ${isToday ? 'today' : ''}" data-date="${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}">${i}</div>`);
    }

    // Next month days
    const totalCells = 42;
    const filledCells = getFirstDayOfMonth(year, month) + getDaysInMonth(year, month);
    const remainingCells = totalCells - filledCells;
    for (let i = 1; i <= remainingCells; i++) {
      days.push(`<div class="mini-calendar-day other-month">${i}</div>`);
    }

    miniCalendar.innerHTML = days.join('');

    // Add click handlers
    miniCalendar.querySelectorAll('.mini-calendar-day:not(.other-month)').forEach(dayEl => {
      dayEl.addEventListener('click', () => {
        const date = dayEl.dataset.date;
        if (date) {
          switchTab('calendar');
          window.showToast(`${date} tarihine geçildi`);
        }
      });
    });
  }

  // Navigation buttons
  const prevBtn = $('#mini-prev');
  const nextBtn = $('#mini-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      miniCalendarDate.setMonth(miniCalendarDate.getMonth() - 1);
      renderMiniCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      miniCalendarDate.setMonth(miniCalendarDate.getMonth() + 1);
      renderMiniCalendar();
    });
  }

  // Initial render
  renderMiniCalendar();
}

/**
 * Show Toast Notification
 */
window.showToast = function (message, type = 'success') {
  const existing = $('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

/**
 * Show Error
 */
window.showError = function (message) {
  window.showToast(message, 'error');
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

// Export globals for debugging
window.AppState = AppState;
window.store = store;
window.storage = storage;
