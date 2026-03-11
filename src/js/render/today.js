/**
 * LifeSync - Today Tab Renderer
 */

import { store } from '../utils/store.js';
import { storage } from '../utils/storage.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

export function renderToday() {
  const container = $('#today-tasks-list');
  if (!container) return;

  const state = store.getState();
  const tasks = state.tasks || [];
  
  const todayTasks = tasks.filter(t => !t.dueDate || t.dueDate === new Date().toISOString().split('T')[0]);
  
  if (todayTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <h3 class="empty-state-title">Bugün görev yok</h3>
        <p class="empty-state-text">Yeni bir görev eklemek için + butonuna tıklayın</p>
      </div>
    `;
  } else {
    container.innerHTML = todayTasks.map(task => `
      <div class="task-item ${task.status === 'done' ? 'completed' : ''}" data-task-id="${task.id}">
        <div class="task-checkbox ${task.status === 'done' ? 'checked' : ''}" data-task-id="${task.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="task-content">
          <div class="task-title">${task.title}</div>
          <div class="task-meta">
            <span class="task-priority ${task.priority || 'medium'}">${getPriorityLabel(task.priority)}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="task-action-btn edit-task" data-task-id="${task.id}" title="Düzenle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="task-action-btn delete-task" data-task-id="${task.id}" title="Sil">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    // Add click handlers for task completion
    container.querySelectorAll('.task-checkbox').forEach(checkbox => {
      checkbox.addEventListener('click', async (e) => {
        e.stopPropagation();
        const taskId = checkbox.dataset.taskId;
        await toggleTaskComplete(taskId);
      });
    });

    // Add click handlers for task actions
    container.querySelectorAll('.task-item').forEach(taskItem => {
      taskItem.addEventListener('click', (e) => {
        if (e.target.closest('.task-actions') || e.target.closest('.task-checkbox')) return;
        const taskId = taskItem.dataset.taskId;
        openTaskDetail(taskId);
      });
    });

    container.querySelectorAll('.edit-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        openTaskEdit(taskId);
      });
    });

    container.querySelectorAll('.delete-task').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        await deleteTask(taskId);
      });
    });
  }

  // Update stats
  updateTodayStats(tasks);
}

async function toggleTaskComplete(taskId) {
  const state = store.getState();
  const tasks = state.tasks || [];
  const task = tasks.find(t => t.id === taskId);
  
  if (task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await storage.updateTask(taskId, { status: newStatus });
    
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    
    store.setState({ tasks: updatedTasks }, 'toggle-task');
    renderToday();
    
    window.showToast(newStatus === 'done' ? 'Görev tamamlandı!' : 'Görev yeniden açıldı');
  }
}

function getPriorityLabel(priority) {
  const labels = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    urgent: 'Acil'
  };
  return labels[priority] || 'Orta';
}

function openTaskDetail(taskId) {
  const state = store.getState();
  const tasks = state.tasks || [];
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) return;
  
  const modal = $('#task-detail-modal');
  const content = $('#task-detail-content');
  
  if (modal && content) {
    content.innerHTML = `
      <div class="task-detail-header">
        <span class="task-priority ${task.priority || 'medium'}">${getPriorityLabel(task.priority)}</span>
        <span class="task-status-badge ${task.status}">${getStatusLabel(task.status)}</span>
      </div>
      <h2 class="task-detail-title-text">${task.title}</h2>
      ${task.description ? `<p class="task-detail-desc">${task.description}</p>` : ''}
      <div class="task-detail-meta">
        <div class="meta-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <span>Oluşturuldu: ${new Date(task.createdAt).toLocaleDateString('tr-TR')}</span>
        </div>
      </div>
      <div class="task-detail-actions">
        <button class="btn btn-secondary" onclick="closeTaskDetailModal()">Kapat</button>
        <button class="btn btn-primary" onclick="openTaskEditFromDetail('${task.id}')">Düzenle</button>
      </div>
    `;
    modal.classList.add('active');
  }
}

window.closeTaskDetailModal = function() {
  const modal = $('#task-detail-modal');
  if (modal) modal.classList.remove('active');
};

window.openTaskEditFromDetail = function(taskId) {
  window.closeTaskDetailModal();
  openTaskEdit(taskId);
};

function openTaskEdit(taskId) {
  const state = store.getState();
  const tasks = state.tasks || [];
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) return;
  
  const modal = $('#task-modal');
  const titleEl = $('#task-modal-title');
  const titleInput = $('#task-title');
  const descInput = $('#task-description');
  const prioritySelect = $('#task-priority');
  const statusSelect = $('#task-status');
  
  if (modal) {
    if (titleEl) titleEl.textContent = 'Görevi Düzenle';
    if (titleInput) titleInput.value = task.title;
    if (descInput) descInput.value = task.description || '';
    if (prioritySelect) prioritySelect.value = task.priority || 'medium';
    if (statusSelect) statusSelect.value = task.status || 'todo';
    
    modal.dataset.editTaskId = taskId;
    modal.classList.add('active');
  }
}

window.openTaskEdit = openTaskEdit;

async function deleteTask(taskId) {
  if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) return;
  
  await storage.deleteTask(taskId);
  
  const state = store.getState();
  const tasks = state.tasks.filter(t => t.id !== taskId);
  store.setState({ tasks }, 'delete-task');
  
  renderToday();
  window.showToast('Görev silindi!');
}

function getStatusLabel(status) {
  const labels = {
    todo: 'Yapılacak',
    'in-progress': 'Devam Ediyor',
    'in-review': 'İnceleme',
    done: 'Tamamlandı'
  };
  return labels[status] || 'Yapılacak';
}

function updateTodayStats(tasks) {
  const totalEl = $('#total-tasks');
  const completedEl = $('#completed-tasks');
  const pendingEl = $('#pending-tasks');
  
  if (totalEl) totalEl.textContent = tasks.length;
  if (completedEl) completedEl.textContent = tasks.filter(t => t.status === 'done').length;
  if (pendingEl) pendingEl.textContent = tasks.filter(t => t.status !== 'done').length;
}
