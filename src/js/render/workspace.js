/**
 * LifeSync - Workspace Renderer
 */

import { store } from '../utils/store.js';
import { storage } from '../utils/storage.js';

let currentView = 'projects';

const KANBAN_COLUMNS = [
  { id: 'todo', title: 'Yapılacak', color: '#6b7280' },
  { id: 'in-progress', title: 'Devam Ediyor', color: '#3b82f6' },
  { id: 'in-review', title: 'İnceleme', color: '#f59e0b' },
  { id: 'done', title: 'Tamamlandı', color: '#10b981' }
];

export function renderWorkspace() {
  const container = $('#tab-workspace .workspace-container');
  if (!container) return;

  const projects = store.getState().projects || [];
  const tasks = store.getState().tasks || [];

  renderWorkspaceTabs(container);

  switch (currentView) {
    case 'projects':
      renderProjectsView(container, projects);
      break;
    case 'kanban':
      renderKanbanView(container, tasks);
      break;
    case 'timeline':
      renderTimelineView(container, projects);
      break;
  }
}

function renderWorkspaceTabs(container) {
  const tabsContainer = container.querySelector('.workspace-tabs');
  if (!tabsContainer) return;

  tabsContainer.querySelectorAll('.workspace-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tabsContainer.querySelectorAll('.workspace-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentView = tab.dataset.view;
      renderWorkspace();
    });
  });
}

function renderProjectsView(container, projects) {
  const view = container.querySelector('#view-projects');
  if (!view) return;

  const projectsGrid = view.querySelector('.projects-grid');
  if (!projectsGrid) return;

  if (projects.length === 0) {
    projectsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <h3 class="empty-state-title">Henüz proje yok</h3>
        <p class="empty-state-text">Yeni bir proje oluşturmak için + butonuna tıklayın</p>
      </div>
    `;
    return;
  }

  projectsGrid.innerHTML = projects.map(project => `
    <div class="project-card" data-id="${project.id}" style="--project-color: ${project.color || '#06b6d4'}">
      <div class="project-header">
        <div>
          <h3 class="project-name">${project.name}</h3>
          <p class="project-description">${project.description || ''}</p>
        </div>
      </div>
      <div class="project-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${project.progress || 0}%; background: ${project.color || '#06b6d4'}"></div>
        </div>
        <div class="progress-info">
          <span>${project.progress || 0}% tamamlandı</span>
          <span>${project.tasks?.length || 0} görev</span>
        </div>
      </div>
      <div class="project-meta">
        <div class="project-team">
          ${(project.members || []).slice(0, 3).map(m => `<img class="task-assignee" src="${m.avatar}" alt="${m.name}">`).join('')}
        </div>
        <div class="project-stats">
          <span class="project-stat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            ${project.completed || 0}
          </span>
        </div>
      </div>
    </div>
  `).join('');

  // Add click handlers
  projectsGrid.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      openProjectModal(id);
    });
  });
}

function renderKanbanView(container, tasks) {
  const view = container.querySelector('#view-kanban');
  if (!view) return;

  const board = view.querySelector('.kanban-board');
  if (!board) return;

  board.innerHTML = KANBAN_COLUMNS.map(column => {
    const columnTasks = tasks.filter(t => t.status === column.id);

    return `
      <div class="kanban-column" data-status="${column.id}">
        <div class="kanban-header">
          <span class="kanban-title">${column.title}</span>
          <span class="kanban-count">${columnTasks.length}</span>
        </div>
        <div class="kanban-tasks">
          ${columnTasks.map(task => `
            <div class="kanban-task" draggable="true" data-id="${task.id}">
              <div class="kanban-task-title">${task.title}</div>
              <div class="kanban-task-meta">
                <div class="kanban-task-tags">
                  <span class="kanban-tag">${task.priority || 'medium'}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <button class="kanban-add-btn" data-status="${column.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Görev ekle
        </button>
      </div>
    `;
  }).join('');

  // Add drag and drop handlers
  initDragAndDrop(board);
  initAddTaskButtons(board);
}

function initDragAndDrop(board) {
  let draggedItem = null;

  board.querySelectorAll('.kanban-task').forEach(task => {
    task.addEventListener('dragstart', (e) => {
      draggedItem = task;
      task.style.opacity = '0.5';
    });

    task.addEventListener('dragend', () => {
      task.style.opacity = '1';
      draggedItem = null;
    });
  });

  board.querySelectorAll('.kanban-column').forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      column.querySelector('.kanban-tasks').style.background = 'rgba(6, 182, 212, 0.1)';
    });

    column.addEventListener('dragleave', () => {
      column.querySelector('.kanban-tasks').style.background = '';
    });

    column.addEventListener('drop', async (e) => {
      e.preventDefault();
      column.querySelector('.kanban-tasks').style.background = '';

      if (draggedItem) {
        const taskId = draggedItem.dataset.id;
        const newStatus = column.dataset.status;

        // Update task status in store
        await storage.updateTask(taskId, { status: newStatus });

        // Update memory store as well
        const updatedTasks = store.getState().tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
        store.setState({ tasks: updatedTasks }, 'update-task-status');

        // Refresh the view
        renderWorkspace();
      }
    });
  });
}

function initAddTaskButtons(board) {
  board.querySelectorAll('.kanban-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const status = btn.dataset.status;
      if (window.openTaskModal) window.openTaskModal(null, status);
    });
  });
}

function renderTimelineView(container, projects) {
  const view = container.querySelector('#view-timeline');
  if (!view) return;

  const timeline = view.querySelector('.timeline-container');
  if (!timeline) return;

  const allTasks = store.getState().tasks || [];
  const sortedTasks = [...allTasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (sortedTasks.length === 0) {
    timeline.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <h3 class="empty-state-title">Zaman çizelgesi boş</h3>
        <p class="empty-state-text">Görevleriniz zaman çizelgesinde görünecek</p>
      </div>
    `;
    return;
  }

  timeline.innerHTML = sortedTasks.slice(0, 10).map(task => `
    <div class="timeline-item">
      <div class="timeline-marker"></div>
      <div class="timeline-content">
        <div class="timeline-date">${formatDate(task.dueDate)}</div>
        <h4 class="timeline-title">${task.title}</h4>
        <p class="timeline-description">${task.description || 'Açıklama yok'}</p>
      </div>
    </div>
  `).join('');
}

function formatDate(dateStr) {
  if (!dateStr) return 'Tarih yok';
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function openProjectModal(projectId) {
  const modal = $('#project-modal');
  if (modal) {
    modal.classList.add('active');
  }
}

export function refreshWorkspace() {
  renderWorkspace();
}
