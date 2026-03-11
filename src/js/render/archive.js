/**
 * LifeSync - Archive Renderer
 */

import { store } from '../utils/store.js';
import { storage } from '../utils/storage.js';

let currentFilter = 'all';
let searchQuery = '';

export function renderArchive() {
  const container = $('#tab-archive .archive-container');
  if (!container) return;

  const archivedTasks = store.getState().archivedTasks || [];
  const archivedEvents = store.getState().archivedEvents || [];
  const archivedProjects = store.getState().archivedProjects || [];

  renderArchiveStats(container, archivedTasks, archivedEvents, archivedProjects);
  renderArchiveList(container, archivedTasks, archivedEvents, archivedProjects);
  initArchiveFilters(container);
}

function renderArchiveStats(container, tasks, events, projects) {
  const statsContainer = container.querySelector('.archive-stats');
  if (!statsContainer) return;

  statsContainer.innerHTML = `
    <div class="archive-stat">
      <span class="archive-stat-value" style="color: var(--accent-secondary)">${tasks.length}</span>
      <span class="archive-stat-label">Arşivlenen Görevler</span>
    </div>
    <div class="archive-stat">
      <span class="archive-stat-value" style="color: var(--accent-primary)">${events.length}</span>
      <span class="archive-stat-label">Arşivlenen Etkinlikler</span>
    </div>
    <div class="archive-stat">
      <span class="archive-stat-value" style="color: var(--accent-emerald)">${projects.length}</span>
      <span class="archive-stat-label">Arşivlenen Projeler</span>
    </div>
  `;
}

function renderArchiveList(container, tasks, events, projects) {
  const list = container.querySelector('.archive-list');
  if (!list) return;

  let allItems = [];

  if (currentFilter === 'all' || currentFilter === 'task') {
    allItems = allItems.concat(tasks.map(t => ({ ...t, type: 'task' })));
  }
  if (currentFilter === 'all' || currentFilter === 'event') {
    allItems = allItems.concat(events.map(e => ({ ...e, type: 'event' })));
  }
  if (currentFilter === 'all' || currentFilter === 'project') {
    allItems = allItems.concat(projects.map(p => ({ ...p, type: 'project' })));
  }

  // Filter by search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    allItems = allItems.filter(item => 
      item.title?.toLowerCase().includes(query) ||
      item.name?.toLowerCase().includes(query)
    );
  }

  // Sort by archived date (newest first)
  allItems.sort((a, b) => new Date(b.archivedAt || b.updatedAt) - new Date(a.archivedAt || a.updatedAt));

  if (allItems.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="21 8 21 21 3 21 3 8"></polyline>
            <rect x="1" y="3" width="22" height="5"></rect>
            <line x1="10" y1="12" x2="14" y2="12"></line>
          </svg>
        </div>
        <h3 class="empty-state-title">Arşiv boş</h3>
        <p class="empty-state-text">Arşivlenen öğeler burada görünecek</p>
      </div>
    `;
    return;
  }

  list.innerHTML = allItems.map(item => {
    const iconClass = item.type;
    const title = item.title || item.name;
    const date = item.archivedAt || item.updatedAt;
    
    return `
      <div class="archive-item" data-id="${item.id}" data-type="${item.type}">
        <div class="archive-item-icon ${iconClass}">
          ${getItemIcon(item.type)}
        </div>
        <div class="archive-item-content">
          <h4 class="archive-item-title">${title}</h4>
          <p class="archive-item-meta">${formatDate(date)} • ${getTypeLabel(item.type)}</p>
        </div>
        <div class="archive-item-actions">
          <button class="archive-action-btn restore" data-action="restore" title="Geri yükle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
          </button>
          <button class="archive-action-btn delete" data-action="delete" title="Kalıcı olarak sil">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Add event handlers
  initListActions(list);
}

function getItemIcon(type) {
  switch (type) {
    case 'task':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>`;
    case 'event':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>`;
    case 'project':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>`;
    default:
      return '';
  }
}

function getTypeLabel(type) {
  switch (type) {
    case 'task': return 'Görev';
    case 'event': return 'Etkinlik';
    case 'project': return 'Proje';
    default: return 'Öğe';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'Tarih yok';
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function initArchiveFilters(container) {
  const searchInput = container.querySelector('.search-filter input');
  const filterSelect = container.querySelector('.archive-select');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderArchive();
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      currentFilter = e.target.value;
      renderArchive();
    });
  }
}

function initListActions(list) {
  list.querySelectorAll('.archive-action-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const item = btn.closest('.archive-item');
      const id = item.dataset.id;
      const type = item.dataset.type;

      if (action === 'restore') {
        await restoreItem(id, type);
        window.showToast('Öğe geri yüklendi');
      } else if (action === 'delete') {
        if (confirm('Bu öğeyi kalıcı olarak silmek istediğinizden emin misiniz?')) {
          await deleteItem(id, type);
          window.showToast('Öğe silindi');
        }
      }
    });
  });
}

async function restoreItem(id, type) {
  // Update store and storage
  const state = store.getState();
  
  switch (type) {
    case 'task':
      const task = state.archivedTasks?.find(t => t.id === id);
      if (task) {
        await storage.saveTask({ ...task, archived: false });
      }
      break;
    case 'event':
      const event = state.archivedEvents?.find(e => e.id === id);
      if (event) {
        await storage.saveEvent({ ...event, archived: false });
      }
      break;
    case 'project':
      const project = state.archivedProjects?.find(p => p.id === id);
      if (project) {
        await storage.saveProject({ ...project, archived: false });
      }
      break;
  }

  renderArchive();
}

async function deleteItem(id, type) {
  // Permanently delete from storage
  switch (type) {
    case 'task':
      await storage.deleteTask(id);
      break;
    case 'event':
      await storage.deleteEvent(id);
      break;
    case 'project':
      await storage.deleteProject(id);
      break;
  }

  renderArchive();
}

export function refreshArchive() {
  renderArchive();
}
