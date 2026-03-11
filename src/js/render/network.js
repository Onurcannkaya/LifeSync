/**
 * LifeSync - Network Renderer
 * Real Supabase data: pending requests + accepted friends
 */

import { store } from '../utils/store.js';
import {
  fetchPendingRequests,
  fetchFriends,
  acceptFriend,
  rejectFriend
} from '../utils/supabase.js';

// Module-level cache
let _currentUserId = null;

/**
 * Main render entry point — called when Ağım tab is activated.
 */
export async function renderNetwork(userId) {
  const container = document.querySelector('#tab-network .network-container');
  if (!container) return;

  _currentUserId = userId || window.AppState?.currentUser?.id;
  if (!_currentUserId) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem;">Ağ verilerini görmek için giriş yapın.</p>';
    return;
  }

  // Show loading state
  const statsContainer = container.querySelector('.team-stats');
  const teamGrid = container.querySelector('.team-grid');
  const activityFeed = container.querySelector('.activity-feed');

  if (teamGrid) teamGrid.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem;">Yükleniyor...</p>';

  try {
    const [pendingRequests, friends] = await Promise.all([
      fetchPendingRequests(_currentUserId),
      fetchFriends(_currentUserId)
    ]);

    // Render stats
    renderStats(statsContainer, friends.length, pendingRequests.length);

    // Render pending requests + friends grid
    renderPendingAndFriends(teamGrid, pendingRequests, friends);

    // Activity feed placeholder
    renderActivityPlaceholder(activityFeed);

  } catch (err) {
    console.error('renderNetwork error:', err);
    if (teamGrid) teamGrid.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem;">Ağ verileri yüklenemedi.</p>';
  }
}

function renderStats(container, friendCount, pendingCount) {
  if (!container) return;
  container.innerHTML = `
    <div class="stat-card">
      <span class="stat-value">${friendCount}</span>
      <span class="stat-label">Arkadaş</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">${pendingCount}</span>
      <span class="stat-label">Bekleyen İstek</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">${friendCount + pendingCount}</span>
      <span class="stat-label">Toplam Bağlantı</span>
    </div>
  `;
}

function renderPendingAndFriends(grid, pendingRequests, friends) {
  if (!grid) return;

  let html = '';

  // ── Pending Requests Section ──
  if (pendingRequests.length > 0) {
    html += `
      <div style="grid-column: 1 / -1; margin-bottom: 0.5rem;">
        <h3 style="color: var(--text-primary); font-size: 1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
          </svg>
          Bekleyen İstekler
          <span style="background: var(--accent); color: #fff; font-size: 0.75rem; padding: 2px 8px; border-radius: 12px;">${pendingRequests.length}</span>
        </h3>
      </div>
    `;

    html += pendingRequests.map(req => {
      const sender = req.sender || {};
      const avatar = sender.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sender.email || 'default'}`;
      const name = sender.name || 'Bilinmeyen';
      const email = sender.email || '';

      return `
        <div class="team-member-card" style="position:relative;">
          <div class="member-avatar">
            <img src="${avatar}" alt="${name}">
            <div class="member-status" style="background: #f59e0b;"></div>
          </div>
          <h4 class="member-name">${name}</h4>
          <p class="member-role" style="font-size:0.75rem;">${email}</p>
          <div style="display:flex; gap:8px; margin-top:12px; width:100%;">
            <button class="btn btn-primary btn-sm accept-friend-btn" data-request-id="${req.id}" style="flex:1; font-size:0.75rem; padding:6px 8px;">
              ✓ Kabul
            </button>
            <button class="btn btn-ghost btn-sm reject-friend-btn" data-request-id="${req.id}" style="flex:1; font-size:0.75rem; padding:6px 8px; border:1px solid var(--border-color);">
              ✗ Reddet
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ── Friends Section ──
  if (friends.length > 0) {
    html += `
      <div style="grid-column: 1 / -1; margin-top: ${pendingRequests.length > 0 ? '1.5rem' : '0'}; margin-bottom: 0.5rem;">
        <h3 style="color: var(--text-primary); font-size: 1rem; display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Arkadaşlarım
        </h3>
      </div>
    `;

    html += friends.map(friend => {
      const avatar = friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.email || 'default'}`;
      return `
        <div class="team-member-card">
          <div class="member-avatar">
            <img src="${avatar}" alt="${friend.name}">
            <div class="member-status online"></div>
          </div>
          <h4 class="member-name">${friend.name || 'Kullanıcı'}</h4>
          <p class="member-role" style="font-size:0.75rem;">${friend.email || ''}</p>
        </div>
      `;
    }).join('');
  }

  // ── Empty State ──
  if (pendingRequests.length === 0 && friends.length === 0) {
    html = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h3 class="empty-state-title">Henüz bağlantınız yok</h3>
        <p class="empty-state-text">"Üye Davet Et" butonuyla arkadaş aramaya başlayın</p>
      </div>
    `;
  }

  grid.innerHTML = html;

  // ── Bind Accept / Reject buttons ──
  grid.querySelectorAll('.accept-friend-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const requestId = btn.dataset.requestId;
      btn.disabled = true;
      btn.textContent = '...';
      try {
        await acceptFriend(requestId);
        window.showToast?.('Arkadaşlık isteği kabul edildi!');
        renderNetwork(_currentUserId); // Re-render
      } catch (err) {
        console.error('acceptFriend UI error:', err);
        window.showToast?.('İstek kabul edilemedi.');
        btn.disabled = false;
        btn.textContent = '✓ Kabul';
      }
    });
  });

  grid.querySelectorAll('.reject-friend-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const requestId = btn.dataset.requestId;
      btn.disabled = true;
      btn.textContent = '...';
      try {
        await rejectFriend(requestId);
        window.showToast?.('Arkadaşlık isteği reddedildi.');
        renderNetwork(_currentUserId); // Re-render
      } catch (err) {
        console.error('rejectFriend UI error:', err);
        window.showToast?.('İstek reddedilemedi.');
        btn.disabled = false;
        btn.textContent = '✗ Reddet';
      }
    });
  });
}

function renderActivityPlaceholder(feed) {
  if (!feed) return;
  feed.innerHTML = `
    <div class="empty-state">
      <p class="empty-state-text">Arkadaş ekledikçe aktivite akışı burada görünecek</p>
    </div>
  `;
}

export function refreshNetwork() {
  renderNetwork(_currentUserId);
}
